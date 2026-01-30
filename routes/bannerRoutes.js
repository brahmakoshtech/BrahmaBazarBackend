import express from 'express';
import upload from '../config/multer.js';
import {
    createBanner,
    getBanners,
    getAdminBanners,
    updateBanner,
    deleteBanner
} from '../controllers/bannerController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getBanners) // Public list (query param: position)
    .post(protect, admin, upload.single('image'), createBanner);

router.route('/admin')
    .get(protect, admin, getAdminBanners);

router.route('/:id')
    .put(protect, admin, upload.single('image'), updateBanner)
    .delete(protect, admin, deleteBanner);

export default router;
