const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const len = (s, min, max) => typeof s === 'string' && s.trim().length >= min && s.trim().length <= max;

// Each rule returns true or an error message.
const v = {
  name: (x) => len(x, 1, 60) || 'Name is required and must be 60 characters or fewer',
  storeName: (x) => len(x, 1, 100) || 'Store name must be between 1 and 100 characters',
  email: (x) => (typeof x === 'string' && x.length <= 255 && EMAIL.test(x.trim())) || 'Enter a valid email address',
  address: (x) => len(x, 1, 400) || 'Address is required and must be 400 characters or fewer',
  password: (x) =>
    (typeof x === 'string' && /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/.test(x)) ||
    'Password must be 8–16 characters with at least one uppercase letter and one special character',
  rating: (x) => (Number.isInteger(x) && x >= 1 && x <= 5) || 'Rating must be a whole number from 1 to 5',
  role: (x) => ['admin', 'user', 'owner'].includes(x) || 'Choose a valid role',
};

const validate = (schema) => (req, res, next) => {
  const errors = {};
  for (const [field, rule] of Object.entries(schema)) {
    const result = rule(req.body?.[field]);
    if (result !== true) errors[field] = result;
  }
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Please fix the highlighted fields', errors });
  next();
};

module.exports = { v, validate };
