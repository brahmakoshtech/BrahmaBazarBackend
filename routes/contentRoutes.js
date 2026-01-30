import express from 'express';
import {
    getContentBlocks,
    getAllContentAdmin,
    updateContentBlock,
    createContentBlock,
    seedDefaultContent
} from '../controllers/contentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getContentBlocks).post(protect, admin, createContentBlock);
router.post('/seed', protect, admin, seedDefaultContent);
router.get('/admin', protect, admin, getAllContentAdmin);

router.route('/:identifier')
    .put(protect, admin, updateContentBlock);

export default router;
