const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
// MongoDB and creates the GridFS bucket for PDF storage

let gfsBucket;

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGODB_URI);

  gfsBucket = new GridFSBucket(conn.connection.db, {
    bucketName: 'uploads',
  });

  console.log('MongoDB connected');
};

const getGridFSBucket = () => {
  if (!gfsBucket) {
    throw new Error('GridFS bucket not initialized');
  }
  return gfsBucket;
};

module.exports = {
  connectDB,
  getGridFSBucket,
};