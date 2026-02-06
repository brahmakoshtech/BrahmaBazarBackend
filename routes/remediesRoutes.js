import express from 'express';
import { addRemedy, getRemedies, deleteRemedy } from '../controllers/remediesController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, admin, addRemedy)
    .get(protect, admin, getRemedies);

router.route('/:id')
    .delete(protect, admin, deleteRemedy);

export default router;
