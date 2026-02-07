import CheckoutServiceImpl from '../services/impl/CheckoutServiceImpl.js';
import UserAddress from '../models/UserAddress.js';
import { generateSignedUrl } from '../utils/s3Signer.js';

// Helper to sign order images
const signOrder = async (order) => {
    if (!order) return order;
    const signedOrder = order.toObject ? order.toObject() : { ...order };

    if (signedOrder.products && signedOrder.products.length > 0) {
        signedOrder.products = await Promise.all(signedOrder.products.map(async (p) => {
            if (p.image) {
                p.image = await generateSignedUrl(p.image);
            }
            return p;
        }));
    }
    return signedOrder;
};

// @desc    Create order from cart
// @route   POST /api/checkout
// @access  Private
const checkout = async (req, res) => {
    try {
        let { shippingAddress, paymentMethod, couponCode, addressId } = req.body;

        if (addressId) {
            const userAddress = await UserAddress.findById(addressId);
            if (!userAddress) {
                res.status(404);
                throw new Error('Address not found');
            }
            shippingAddress = {
                fullName: userAddress.fullName,
                address: `${userAddress.addressLine1}${userAddress.addressLine2 ? ', ' + userAddress.addressLine2 : ''}${userAddress.landmark ? ', Landmark: ' + userAddress.landmark : ''}`,
                city: userAddress.city,
                state: userAddress.state,
                postalCode: userAddress.pincode,
                country: userAddress.country,
                phone: userAddress.phone
            };
        } else if (shippingAddress) {
            // Auto-save new address to address book
            const count = await UserAddress.countDocuments({ userId: req.user._id });
            try {
                await UserAddress.create({
                    userId: req.user._id,
                    fullName: shippingAddress.fullName,
                    phone: shippingAddress.phone,
                    pincode: shippingAddress.postalCode,
                    state: shippingAddress.state,
                    country: shippingAddress.country || 'India',
                    city: shippingAddress.city,
                    addressLine1: shippingAddress.address,
                    isDefault: count === 0
                });
            } catch (addrErr) {
                console.error("Failed to auto-save address", addrErr);
                // Non-blocking error - proceed with checkout
            }
        }

        const order = await CheckoutServiceImpl.checkout(req.user._id, shippingAddress, paymentMethod, couponCode);
        const signedOrder = await signOrder(order);
        res.status(201).json(signedOrder);
    } catch (error) {
        const isClientError = error.message.includes('Cart is empty') ||
            error.message.includes('Insufficient stock') ||
            error.message.includes('Coupon');
        const statusCode = isClientError ? 400 : 500;
        res.status(statusCode).json({ message: error.message });
    }
};

// @desc    Get delivery addresses for checkout
// @route   GET /api/checkout/address
// @access  Private
const getCheckoutAddresses = async (req, res) => {
    try {
        const addresses = await UserAddress.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
        res.json(addresses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { checkout, getCheckoutAddresses };
