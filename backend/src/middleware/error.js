module.exports = (err, req, res, next) => {
  if (err.code === '23505') return res.status(409).json({ message: 'That email is already in use' });
  if (err.code === '23503') return res.status(404).json({ message: 'Related record not found' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body' });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on our side. Please try again.' });
};
