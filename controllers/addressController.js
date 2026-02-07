
import asyncHandler from 'express-async-handler';
import UserAddress from '../models/UserAddress.js';

// @desc    Add a new address
// @route   POST /api/user/address/add
// @access  Private
const addAddress = asyncHandler(async (req, res) => {
    const { fullName, phone, pincode, state, city, addressLine1, addressLine2, landmark, isDefault } = req.body;
    const userId = req.user._id;

    // Check if this is the first address for the user
    const addressCount = await UserAddress.countDocuments({ userId });

    let isDefaultAddress = isDefault;
    if (addressCount === 0) {
        isDefaultAddress = true; // Force default if it's the first one
    }

    if (isDefaultAddress) {
        // Unset other defaults
        await UserAddress.updateMany({ userId }, { isDefault: false });
    }

    const address = await UserAddress.create({
        userId,
        fullName,
        phone,
        pincode,
        state,
        city,
        addressLine1,
        addressLine2,
        landmark,
        isDefault: isDefaultAddress,
    });

    res.status(201).json(address);
});

// @desc    Get user addresses
// @route   GET /api/user/address/list
// @access  Private
const getAddresses = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    // Sort so default is first, then by creation date
    const addresses = await UserAddress.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
    res.json(addresses);
});

// @desc    Update an address
// @route   PUT /api/user/address/update/:id
// @access  Private
const updateAddress = asyncHandler(async (req, res) => {
    const addressId = req.params.id;
    const userId = req.user._id;
    const { fullName, phone, pincode, state, city, addressLine1, addressLine2, landmark, isDefault } = req.body;

    const address = await UserAddress.findOne({ _id: addressId, userId });

    if (!address) {
        res.status(404);
        throw new Error('Address not found');
    }

    if (isDefault) {
        await UserAddress.updateMany({ userId }, { isDefault: false });
    }

    address.fullName = fullName || address.fullName;
    address.phone = phone || address.phone;
    address.pincode = pincode || address.pincode;
    address.state = state || address.state;
    address.city = city || address.city;
    address.addressLine1 = addressLine1 || address.addressLine1;
    address.addressLine2 = addressLine2 !== undefined ? addressLine2 : address.addressLine2;
    address.landmark = landmark !== undefined ? landmark : address.landmark;
    if (isDefault !== undefined) address.isDefault = isDefault;

    const updatedAddress = await address.save();
    res.json(updatedAddress);
});

// @desc    Delete an address
// @route   DELETE /api/user/address/delete/:id
// @access  Private
const deleteAddress = asyncHandler(async (req, res) => {
    const addressId = req.params.id;
    const userId = req.user._id;

    const address = await UserAddress.findOne({ _id: addressId, userId });

    if (!address) {
        res.status(404);
        throw new Error('Address not found');
    }

    const wasDefault = address.isDefault;
    await address.deleteOne();

    if (wasDefault) {
        // Set another address as default (e.g., the most recently created one)
        const anotherAddress = await UserAddress.findOne({ userId }).sort({ createdAt: -1 });
        if (anotherAddress) {
            anotherAddress.isDefault = true;
            await anotherAddress.save();
        }
    }

    res.json({ message: 'Address removed' });
});

// @desc    Set default address
// @route   PATCH /api/user/address/set-default/:id
// @access  Private
const setDefaultAddress = asyncHandler(async (req, res) => {
    const addressId = req.params.id;
    const userId = req.user._id;

    const address = await UserAddress.findOne({ _id: addressId, userId });

    if (!address) {
        res.status(404);
        throw new Error('Address not found');
    }

    await UserAddress.updateMany({ userId }, { isDefault: false });

    address.isDefault = true;
    await address.save();

    res.json(address);
});

export {
    addAddress,
    getAddresses,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};
