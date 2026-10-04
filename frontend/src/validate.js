// Mirrors the server rules. Each returns true or an error message.
const len = (s, min, max) => typeof s === 'string' && s.trim().length >= min && s.trim().length <= max;

export const PW_HINT = '8–16 characters, with one uppercase letter and one special character';

export const rules = {
  name: (x) => len(x, 1, 60) || 'Name is required and must be 60 characters or fewer',
  storeName: (x) => len(x, 1, 100) || 'Store name must be between 1 and 100 characters',
  email: (x) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((x || '').trim()) || 'Enter a valid email address',
  address: (x) => len(x, 1, 400) || 'Address is required and must be 400 characters or fewer',
  password: (x) => /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/.test(x || '') || `Password must be ${PW_HINT}`,
  required: (x) => !!x || 'This field is required',
};

export function check(values, fields) {
  const errors = {};
  for (const f of fields) {
    if (!f.rule) continue;
    const fn = typeof f.rule === 'function' ? f.rule : rules[f.rule];
    const result = fn(values[f.name], values);
    if (result !== true) errors[f.name] = result;
  }
  return errors;
}
