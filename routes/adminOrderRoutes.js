import express from 'express';
import {
    getOrders,
    getOrderById,
    updateOrderStatus,
    updatePaymentStatus,
    deleteOrder,
} from '../controllers/adminOrderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect and admin middleware to all routes
router.use(protect, admin);

router.route('/').get(getOrders);
router.route('/:id').get(getOrderById).delete(deleteOrder);
router.route('/:id/status').put(updateOrderStatus);
router.route('/:id/payment').put(updatePaymentStatus);

export default router;
