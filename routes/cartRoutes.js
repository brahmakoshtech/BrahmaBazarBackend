import express from 'express';
import { addToCart, getCart, updateCartItem, removeCartItem } from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getCart)
    .post(protect, addToCart);

router.route('/:productId')
    .put(protect, updateCartItem)
    .delete(protect, removeCartItem);

export default router;
