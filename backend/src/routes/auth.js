const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const wrap = require('../middleware/wrap');
const { auth } = require('../middleware/auth');
const { v, validate } = require('../middleware/validate');

const sign = (u) =>
  jwt.sign({ id: u.id, role: u.role, name: u.name }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
const pub = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

// Public sign-up always creates a normal user.
router.post(
  '/signup',
  validate({ name: v.name, email: v.email, address: v.address, password: v.password }),
  wrap(async (req, res) => {
    const { name, email, address, password } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const { rows: [u] } = await db.query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES ($1, $2, $3, $4, 'user') RETURNING id, name, email, role`,
      [name.trim(), email.trim().toLowerCase(), hash, address.trim()]
    );
    res.status(201).json({ token: sign(u), user: pub(u) });
  })
);

router.post(
  '/login',
  wrap(async (req, res) => {
    const { email = '', password = '' } = req.body || {};
    const { rows: [u] } = await db.query('SELECT * FROM users WHERE email = $1', [String(email).trim().toLowerCase()]);
    const ok = u && (await bcrypt.compare(String(password), u.password_hash));
    if (!ok) return res.status(401).json({ message: 'Incorrect email or password' });
    res.json({ token: sign(u), user: pub(u) });
  })
);

router.get(
  '/me',
  auth,
  wrap(async (req, res) => {
    const { rows: [u] } = await db.query('SELECT id, name, email, address, role FROM users WHERE id = $1', [req.user.id]);
    if (!u) return res.status(401).json({ message: 'Account no longer exists' });
    res.json(u);
  })
);

// Edit own profile (name, email, address). Re-issues the token because it carries the name.
router.put(
  '/profile',
  auth,
  validate({ name: v.name, email: v.email, address: v.address }),
  wrap(async (req, res) => {
    const { name, email, address } = req.body;
    const { rows: [u] } = await db.query(
      `UPDATE users SET name = $1, email = $2, address = $3 WHERE id = $4 RETURNING id, name, email, role`,
      [name.trim(), email.trim().toLowerCase(), address.trim(), req.user.id]
    );
    if (!u) return res.status(401).json({ message: 'Account no longer exists' });
    res.json({ token: sign(u), user: pub(u) });
  })
);

router.put(
  '/password',
  auth,
  validate({ newPassword: v.password }),
  wrap(async (req, res) => {
    const { currentPassword = '', newPassword } = req.body;
    const { rows: [u] } = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!u || !(await bcrypt.compare(String(currentPassword), u.password_hash))) {
      return res.status(400).json({ message: 'Please fix the highlighted fields', errors: { currentPassword: 'Current password is incorrect' } });
    }
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [await bcrypt.hash(newPassword, 12), req.user.id]);
    res.json({ message: 'Password updated' });
  })
);

module.exports = router;
