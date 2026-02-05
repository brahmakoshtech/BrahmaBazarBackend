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

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
    try {
        const orders = await OrderServiceImpl.getAllOrders(req.query);
        const signedOrders = await Promise.all(orders.map(signOrder));
        res.json(signedOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single order by ID
// @route   GET /api/admin/orders/:id
// @access  Private/Admin
const getOrderById = async (req, res) => {
    try {
        const order = await OrderServiceImpl.adminGetOrderById(req.params.id);
        const signedOrder = await signOrder(order);
        res.json(signedOrder);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    try {
        const { orderStatus } = req.body;
        const updatedOrder = await OrderServiceImpl.updateOrderStatus(req.params.id, orderStatus);
        const signedOrder = await signOrder(updatedOrder);
        res.json(signedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update payment status
// @route   PUT /api/admin/orders/:id/payment
// @access  Private/Admin
const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const updatedOrder = await OrderServiceImpl.updatePaymentStatus(req.params.id, paymentStatus);
        const signedOrder = await signOrder(updatedOrder);
        res.json(signedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete or Cancel order
// @route   DELETE /api/admin/orders/:id
// @access  Private/Admin
const deleteOrder = async (req, res) => {
    try {
        const result = await OrderServiceImpl.deleteOrder(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export { getOrders, getOrderById, updateOrderStatus, updatePaymentStatus, deleteOrder };
