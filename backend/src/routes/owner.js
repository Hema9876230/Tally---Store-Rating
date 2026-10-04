const router = require('express').Router();
const db = require('../db');
const wrap = require('../middleware/wrap');
const { auth, allow } = require('../middleware/auth');

router.use(auth, allow('owner'));

router.get(
  '/dashboard',
  wrap(async (req, res) => {
    const { rows: stores } = await db.query(
      `SELECT s.id, s.name, s.address, ROUND(AVG(r.rating), 1)::float AS rating, COUNT(r.id)::int AS rating_count
       FROM stores s LEFT JOIN ratings r ON r.store_id = s.id
       WHERE s.owner_id = $1 GROUP BY s.id ORDER BY s.name`,
      [req.user.id]
    );
    const { rows: raters } = await db.query(
      `SELECT r.store_id, s.name AS store_name, u.id AS user_id, u.name, u.email, r.rating, r.updated_at
       FROM ratings r JOIN users u ON u.id = r.user_id JOIN stores s ON s.id = r.store_id
       WHERE s.owner_id = $1 ORDER BY r.updated_at DESC`,
      [req.user.id]
    );
    const { rows: [overall] } = await db.query(
      `SELECT ROUND(AVG(r.rating), 1)::float AS rating, COUNT(r.id)::int AS rating_count
       FROM ratings r JOIN stores s ON s.id = r.store_id WHERE s.owner_id = $1`,
      [req.user.id]
    );
    res.json({ stores, raters, overall });
  })
);

module.exports = router;
