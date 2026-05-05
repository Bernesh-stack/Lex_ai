import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import dns from 'dns';
import connectDB from './config/db.js';

// Set DNS to Google to resolve MongoDB SRV records
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Load env vars
dotenv.config();

// Connect to Database
await connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('API is running and MongoDB is connected!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
