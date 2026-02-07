import express from 'express';
import { checkout, getCheckoutAddresses } from '../controllers/checkoutController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/address').get(protect, getCheckoutAddresses);
router.route('/').post(protect, checkout);

export default router;
