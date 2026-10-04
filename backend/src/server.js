require('dotenv').config();
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required. Copy .env.example to .env first.');
  process.exit(1);
}
const app = require('./app');
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Tally API listening on :${port}`));
