import asyncHandler from 'express-async-handler';
import OrderServiceImpl from '../services/impl/OrderServiceImpl.js';
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

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    try {
        const orders = await OrderServiceImpl.getMyOrders(req.user._id);
        const signedOrders = await Promise.all(orders.map(signOrder));
        res.json(signedOrders);
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    try {
        // We pass req.user to service to handle permission check logic
        const order = await OrderServiceImpl.getOrderById(req.params.id, req.user);
        const signedOrder = await signOrder(order);
        res.json(signedOrder);
    } catch (error) {
        // Distinguish errors? For now 404 is safe default or 401 if auth failed in service
        const statusCode = error.message.includes('Not authorized') ? 401 : 404;
        res.status(statusCode);
        throw new Error(error.message);
    }
});

const getOrdersByUser = asyncHandler(async (req, res) => {
    try {
        const orders = await OrderServiceImpl.getOrdersByUserId(req.params.id);
        const signedOrders = await Promise.all(orders.map(signOrder));
        res.json(signedOrders);
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
});

export { getMyOrders, getOrderById, getOrdersByUser };
