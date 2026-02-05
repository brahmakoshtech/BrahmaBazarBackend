import express from 'express';
import upload from '../config/multer.js';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleTrending,
    toggleNewArrival,
    getTrendingProducts,
    getNewArrivalProducts,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/trending', getTrendingProducts);
router.get('/new-arrival', getNewArrivalProducts);

router.route('/')
    .get(getProducts)
    .post(protect, admin, upload.array('images', 5), createProduct);

router.route('/:id')
    .get(getProductById)
    .put(protect, admin, upload.array('images', 5), updateProduct)
    .delete(protect, admin, deleteProduct);

router.put('/:id/trending', protect, admin, toggleTrending);
router.put('/:id/new-arrival', protect, admin, toggleNewArrival);

export default router;
