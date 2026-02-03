import express from 'express';
import upload from '../config/multer.js';
import {
    createReel,
    getReels,
    getAdminReels,
    deleteReel,
    toggleReelStatus
} from '../controllers/reelController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getReels);

router.route('/upload')
    .post(protect, admin, upload.single('video'), createReel);

router.route('/admin')
    .get(protect, admin, getAdminReels);

router.route('/:id')
    .delete(protect, admin, deleteReel);

router.route('/:id/toggle')
    .patch(protect, admin, toggleReelStatus);

export default router;
