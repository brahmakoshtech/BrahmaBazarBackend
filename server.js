import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminOrderRoutes from './routes/adminOrderRoutes.js';
import adminStatsRoutes from './routes/adminStatsRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import contentRoutes from './routes/contentRoutes.js';

dotenv.config();

import seedDeveloper from './utils/seeder.js'; // Import seeder

// ... 

connectDB().then(() => {
  seedDeveloper(); // Run seeder after connection
});

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://e-comm-2adg.vercel.app"
];

// Robust Manual CORS Middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow requests from allowed origins
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  // Allow standard methods and headers
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | Origin: ${req.headers.origin}`);
  next();
});

// Use JSON parser for all routes except webhook
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/payment/webhook')) {
    next();
  } else {
    express.json({ limit: '50mb' })(req, res, next);
  }
});

import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Test Route to check if server is responsive
app.get('/test', (req, res) => {
  res.json({ message: 'API is running successfully' });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/summary', adminStatsRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/content', contentRoutes);
console.log('Routes registered: /api/banners');
console.log('Force Restart: Payment Logic Updated');

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
