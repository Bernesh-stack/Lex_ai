const crypto = require('crypto');

const createShareToken = () => {
  return crypto.randomBytes(24).toString('hex');
};

const getExpiryDate = (days = 7) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

module.exports = {
  createShareToken,
  getExpiryDate,
};
