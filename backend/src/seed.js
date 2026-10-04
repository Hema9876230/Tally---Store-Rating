require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

async function user(name, email, password, address, role) {
  const { rows: [u] } = await db.query(
    `INSERT INTO users (name, email, password_hash, address, role) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id`,
    [name, email, await bcrypt.hash(password, 12), address, role]
  );
  return u.id;
}

(async () => {
  await db.query(fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8'));
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@tally.test').toLowerCase();
  await user('System Administrator', adminEmail, process.env.ADMIN_PASSWORD || 'Admin@12345', '1 Admin Plaza, Head Office', 'admin');
  console.log(`Admin ready: ${adminEmail}`);

  if (process.env.SEED_DEMO !== 'false') {
    const pw = 'Demo@1234';
    const owner = await user('Kavita Desai Store Owner', 'owner@tally.test', pw, '22 Trade Centre Road', 'owner');
    const customers = [];
    for (const [n, e] of [
      ['Ananya Sharma Customer Account', 'ananya@tally.test'],
      ['Rohan Verma Customer Account', 'rohan@tally.test'],
      ['Meera Iyer Customer Account', 'meera@tally.test'],
    ]) customers.push(await user(n, e, pw, '8 Residency Lane', 'user'));

    const stores = [];
    for (const [n, e, a, o] of [
      ['Maple and Rye Bakery', 'maple@tally.test', '12 Market Street', owner],
      ['Northside Hardware and Tools', 'northside@tally.test', '90 Foundry Avenue', owner],
      ['Greenleaf Organic Market', 'greenleaf@tally.test', '5 Orchard Close', null],
      ['Lakeview Books and Coffee', 'lakeview@tally.test', '31 Shoreline Drive', null],
    ]) {
      const { rows: [s] } = await db.query(
        `INSERT INTO stores (name, email, address, owner_id) VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id`,
        [n, e, a, o]
      );
      stores.push(s.id);
    }
    const scores = [[5, 4, 5], [3, 4, 2], [4, 5, 4], [5, 5, 3]];
    for (let s = 0; s < stores.length; s++)
      for (let c = 0; c < customers.length; c++)
        await db.query('INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [customers[c], stores[s], scores[s][c]]);
    console.log('Demo data ready (owner@tally.test, ananya@tally.test — password Demo@1234)');
  }
  await db.end();
})().catch((e) => { console.error(e); process.exit(1); });
