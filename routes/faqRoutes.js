import express from 'express';
import {
    getPublicFaqs,
    getAllFaqs,
    createFaq,
    updateFaq,
    deleteFaq,
    seedFaqs
} from '../controllers/faqController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getPublicFaqs);
router.route('/admin')
    .get(protect, admin, getAllFaqs)
    .post(protect, admin, createFaq);

router.route('/admin/seed').post(protect, admin, seedFaqs);

router.route('/admin/:id')
    .put(protect, admin, updateFaq)
    .delete(protect, admin, deleteFaq);

export default router;
