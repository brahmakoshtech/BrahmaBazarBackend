import express from 'express';
import { getMyOrders, getOrderById, getOrdersByUser } from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/myorders').get(protect, getMyOrders);
router.route('/user/:id').get(protect, admin, getOrdersByUser);
router.route('/:id').get(protect, getOrderById);

export default router;
