import express from 'express';
import {
    sendContactEmail,
    getContacts,
    getContactSettings,
    updateContactSettings
} from '../controllers/contactController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(sendContactEmail)
    .get(protect, admin, getContacts);

router.route('/settings')
    .get(protect, admin, getContactSettings)
    .put(protect, admin, updateContactSettings);

export default router;
