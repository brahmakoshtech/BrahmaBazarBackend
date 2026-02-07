
import express from 'express';
import {
    addAddress,
    getAddresses,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
} from '../controllers/addressController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/add').post(protect, addAddress);
router.route('/list').get(protect, getAddresses);
router.route('/update/:id').put(protect, updateAddress);
router.route('/delete/:id').delete(protect, deleteAddress);
router.route('/set-default/:id').patch(protect, setDefaultAddress);

export default router;
