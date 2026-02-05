import express from 'express';
import upload from '../config/multer.js';
import {
    createCategory,
    getCategories,
    getAdminCategories,
    updateCategory,
    deleteCategory,
    addSubcategory
} from '../controllers/categoryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getCategories) // Public list
    .post(protect, admin, upload.single('image'), createCategory);

router.route('/admin')
    .get(protect, admin, getAdminCategories);

router.route('/:id')
    .put(protect, admin, upload.single('image'), updateCategory)
    .delete(protect, admin, deleteCategory);

router.route('/:id/subcategories')
    .post(protect, admin, upload.single('image'), addSubcategory);

export default router;
