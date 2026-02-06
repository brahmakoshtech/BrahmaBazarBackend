import express from 'express';
import {
    getMobileHomeData,
    getCategoriesTree,
    getMobileProducts,
    getMobileProductById
} from '../controllers/mobileController.js';

const router = express.Router();

router.get('/home', getMobileHomeData);
router.get('/categories-tree', getCategoriesTree);
router.get('/products', getMobileProducts);
router.get('/product/:id', getMobileProductById);

export default router;
