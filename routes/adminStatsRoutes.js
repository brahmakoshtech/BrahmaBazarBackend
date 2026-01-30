import express from 'express';
import { getDashboardStats } from '../controllers/adminStatsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, admin, getDashboardStats);

export default router;
