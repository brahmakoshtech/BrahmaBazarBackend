import CheckoutServiceImpl from '../services/impl/CheckoutServiceImpl.js';
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
        const { shippingAddress, paymentMethod, couponCode } = req.body;
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

export { checkout };
