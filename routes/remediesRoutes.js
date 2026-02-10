import express from 'express';
import {
    addRemedy,
    getRemedies,
    deleteRemedy,
    getRemedyTypes,
    addRemedyType,
    addRemedyFromProduct
} from '../controllers/remediesController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../config/multer.js';

const router = express.Router();

router.post('/add-from-product', protect, admin, addRemedyFromProduct);

router.route('/types')
    .get(getRemedyTypes)
    .post(protect, admin, addRemedyType);

router.route('/')
    .post(protect, admin, upload.single('image'), addRemedy)
    .get(protect, admin, getRemedies);

router.route('/:id')
    .delete(protect, admin, deleteRemedy);

export default router;
