const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const wrap = require('../middleware/wrap');
const { auth, allow } = require('../middleware/auth');
const { v, validate } = require('../middleware/validate');

router.use(auth, allow('admin'));

// ---- query helpers: filters are parameterised, sort columns are whitelisted ----
const like = (s) => `%${String(s).replace(/[%_\\]/g, '\\$&')}%`;
function where(query, map, extra = [], params = []) {
  const parts = [...extra];
  for (const [key, col] of Object.entries(map)) {
    if (typeof query[key] === 'string' && query[key].trim()) {
      params.push(like(query[key].trim()));
      parts.push(`${col} ILIKE $${params.length}`);
    }
  }
  return { sql: parts.length ? `WHERE ${parts.join(' AND ')}` : '', params };
}
const orderBy = (q, cols, def) =>
  `${Object.hasOwn(cols, q.sort) ? cols[q.sort] : cols[def]} ${q.order === 'desc' ? 'DESC' : 'ASC'} NULLS LAST`;

// ---- dashboard ----
router.get(
  '/stats',
  wrap(async (req, res) => {
    const { rows: [c] } = await db.query(
      `SELECT (SELECT COUNT(*) FROM users)::int AS users,
              (SELECT COUNT(*) FROM stores)::int AS stores,
              (SELECT COUNT(*) FROM ratings)::int AS ratings`
    );
    const { rows } = await db.query('SELECT rating, COUNT(*)::int AS n FROM ratings GROUP BY rating');
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    rows.forEach((r) => (distribution[r.rating] = r.n));
    res.json({ ...c, distribution });
  })
);

// ---- users ----
const USER_COLS = { name: 'u.name', email: 'u.email', address: 'u.address', role: 'u.role', rating: 'rating' };
const USER_SELECT = `
  SELECT u.id, u.name, u.email, u.address, u.role,
         (SELECT ROUND(AVG(r.rating), 1)::float FROM ratings r JOIN stores s ON s.id = r.store_id WHERE s.owner_id = u.id) AS rating
  FROM users u`;

router.get(
  '/users',
  wrap(async (req, res) => {
    const params = [];
    const extra = [];
    if (['admin', 'user', 'owner'].includes(req.query.role)) {
      params.push(req.query.role);
      extra.push(`u.role = $${params.length}`);
    }
    const w = where(req.query, { name: 'u.name', email: 'u.email', address: 'u.address' }, extra, params);
    const { rows } = await db.query(`${USER_SELECT} ${w.sql} ORDER BY ${orderBy(req.query, USER_COLS, 'name')}, u.id`, w.params);
    res.json(rows);
  })
);

router.get(
  '/users/:id',
  wrap(async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ message: 'User not found' });
    const { rows: [u] } = await db.query(`${USER_SELECT} WHERE u.id = $1`, [req.params.id]);
    if (!u) return res.status(404).json({ message: 'User not found' });
    res.json(u);
  })
);

router.post(
  '/users',
  validate({ name: v.name, email: v.email, address: v.address, password: v.password, role: v.role }),
  wrap(async (req, res) => {
    const { name, email, address, password, role } = req.body;
    const { rows: [u] } = await db.query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, address, role`,
      [name.trim(), email.trim().toLowerCase(), await bcrypt.hash(password, 12), address.trim(), role]
    );
    res.status(201).json(u);
  })
);

// ---- stores ----
const STORE_COLS = { name: 's.name', email: 's.email', address: 's.address', rating: 'rating' };

router.get(
  '/stores',
  wrap(async (req, res) => {
    const w = where(req.query, { name: 's.name', email: 's.email', address: 's.address' });
    const { rows } = await db.query(
      `SELECT s.id, s.name, s.email, s.address, s.owner_id,
              ROUND(AVG(r.rating), 1)::float AS rating, COUNT(r.id)::int AS rating_count
       FROM stores s LEFT JOIN ratings r ON r.store_id = s.id
       ${w.sql} GROUP BY s.id ORDER BY ${orderBy(req.query, STORE_COLS, 'name')}, s.id`,
      w.params
    );
    res.json(rows);
  })
);

router.post(
  '/stores',
  validate({ name: v.storeName, email: v.email, address: v.address }),
  wrap(async (req, res) => {
    const { name, email, address, ownerId } = req.body;
    if (ownerId != null) {
      const { rows } = await db.query("SELECT 1 FROM users WHERE id = $1 AND role = 'owner'", [ownerId]);
      if (!rows.length) {
        return res.status(400).json({ message: 'Please fix the highlighted fields', errors: { ownerId: 'Choose a user with the store owner role' } });
      }
    }
    const { rows: [s] } = await db.query(
      'INSERT INTO stores (name, email, address, owner_id) VALUES ($1, $2, $3, $4) RETURNING id, name, email, address',
      [name.trim(), email.trim().toLowerCase(), address.trim(), ownerId ?? null]
    );
    res.status(201).json(s);
  })
);

const badOwner = async (ownerId) => {
  if (ownerId == null) return false;
  const { rows } = await db.query("SELECT 1 FROM users WHERE id = $1 AND role = 'owner'", [ownerId]);
  return !rows.length;
};

router.put(
  '/stores/:id',
  validate({ name: v.storeName, email: v.email, address: v.address }),
  wrap(async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ message: 'Store not found' });
    const { name, email, address, ownerId } = req.body;
    if (await badOwner(ownerId)) {
      return res.status(400).json({ message: 'Please fix the highlighted fields', errors: { ownerId: 'Choose a user with the store owner role' } });
    }
    const { rows: [s] } = await db.query(
      'UPDATE stores SET name = $1, email = $2, address = $3, owner_id = $4 WHERE id = $5 RETURNING id, name, email, address, owner_id',
      [name.trim(), email.trim().toLowerCase(), address.trim(), ownerId ?? null, req.params.id]
    );
    if (!s) return res.status(404).json({ message: 'Store not found' });
    res.json(s);
  })
);

module.exports = router;
