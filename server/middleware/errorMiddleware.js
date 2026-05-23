const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'File size exceeds 10MB limit',
    });
  }

  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({
      message: err.message,
    });
  }

  res.status(res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  res.json({
    message: err.message || 'Server error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { errorHandler };