const router = require('express').Router();
const db = require('../db');
const wrap = require('../middleware/wrap');
const { auth, allow } = require('../middleware/auth');
const { v, validate } = require('../middleware/validate');

router.use(auth, allow('user'));

const COLS = { name: 's.name', address: 's.address', rating: 'rating', my_rating: 'my_rating' };

// Store listing for normal users: overall rating + this user's own rating.
router.get(
  '/',
  wrap(async (req, res) => {
    const params = [req.user.id];
    let where = '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q) {
      params.push(`%${q.replace(/[%_\\]/g, '\\$&')}%`);
      where = 'WHERE s.name ILIKE $2 OR s.address ILIKE $2';
    }
    const col = Object.hasOwn(COLS, req.query.sort) ? COLS[req.query.sort] : COLS.name;
    const dir = req.query.order === 'desc' ? 'DESC' : 'ASC';
    const { rows } = await db.query(
      `SELECT s.id, s.name, s.address,
              ROUND(AVG(r.rating), 1)::float AS rating, COUNT(r.id)::int AS rating_count,
              (SELECT rating FROM ratings WHERE store_id = s.id AND user_id = $1) AS my_rating
       FROM stores s LEFT JOIN ratings r ON r.store_id = s.id
       ${where} GROUP BY s.id ORDER BY ${col} ${dir} NULLS LAST, s.id`,
      params
    );
    res.json(rows);
  })
);

// Submit or modify a rating (one per user per store).
router.put(
  '/:id/rating',
  validate({ rating: v.rating }),
  wrap(async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ message: 'Store not found' });
    await db.query(
      `INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, store_id) DO UPDATE SET rating = EXCLUDED.rating, updated_at = now()`,
      [req.user.id, req.params.id, req.body.rating]
    );
    const { rows: [s] } = await db.query(
      'SELECT ROUND(AVG(rating), 1)::float AS rating, COUNT(*)::int AS rating_count FROM ratings WHERE store_id = $1',
      [req.params.id]
    );
    res.json({ my_rating: req.body.rating, ...s });
  })
);

module.exports = router;
