import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import { protect } from './middleware/protect.js';
import dns from 'dns';

// Set DNS to Google to resolve MongoDB SRV records
dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config();

const app = express();

// Connect to Database
connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('API is running');
});

// Routes
app.use('/api/auth', authRoutes);

app.get('/api/test/protected', protect, (req, res) => {
  res.json({
    message: 'Protected route working',
    user: req.user,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
