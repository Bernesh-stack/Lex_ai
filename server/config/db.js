import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Check if it's a DNS/SRV issue
    if (error.message.includes('querySrv ECONNREFUSED')) {
      console.error('TIP: This is usually a DNS or Firewall issue. Try whitelisting your IP in MongoDB Atlas or using a non-SRV connection string.');
    }
    process.exit(1);
  }
};

export default connectDB;
