import express from 'express';
import {
    addRemedy,
    getRemedies,
    deleteRemedy,
    getRemedyTypes,
    addRemedyType,
    addRemedyFromProduct,
    getBanners,
    addBanner,
    deleteRemedyBanner,
    toggleRemedyBanner,
    updateBanner,
    getForYouLayout
} from '../controllers/remediesController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../config/multer.js';

const router = express.Router();

router.post('/add-from-product', protect, admin, addRemedyFromProduct);

router.get('/for-you', getForYouLayout);

router.route('/banners')
    .get(protect, admin, getBanners)
    .post(protect, admin, upload.single('image'), addBanner);

router.route('/banners/:id')
    .delete(protect, admin, deleteRemedyBanner)
    .put(protect, admin, upload.single('image'), updateBanner);

router.put('/banners/:id/toggle', protect, admin, toggleRemedyBanner);

router.route('/types')
    .get(getRemedyTypes)
    .post(protect, admin, addRemedyType);




router.route('/')
    .post(protect, admin, upload.single('image'), addRemedy)
    .get(getRemedies);

router.route('/:id')
    .delete(protect, admin, deleteRemedy);

export default router;
