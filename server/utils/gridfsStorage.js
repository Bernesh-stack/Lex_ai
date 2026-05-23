const multer = require('multer');

// Using memoryStorage to bypass buggy and outdated multer-gridfs-storage which is incompatible with modern Mongoose 9/Mongo Driver 6.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

module.exports = upload;