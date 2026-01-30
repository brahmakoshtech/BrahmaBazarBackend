import PaymentServiceImpl from '../services/impl/PaymentServiceImpl.js';

// @desc    Create Stripe Checkout Session
// @route   POST /api/payment/create-checkout-session
// @access  Private
const createCheckoutSession = async (req, res) => {
    try {
        const { cartItems, orderId } = req.body;
        const result = await PaymentServiceImpl.createCheckoutSession(orderId, cartItems);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Handle Stripe Webhook
// @route   POST /api/payment/webhook
// @access  Public
const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        await PaymentServiceImpl.handleWebhook(req.body, sig);
        res.status(200).send();
    } catch (error) {
        console.error(error.message);
        res.status(400).send(error.message);
    }
};

// @desc    Verify Stripe Payment
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
    try {
        const { orderId, sessionId } = req.body;
        const result = await PaymentServiceImpl.verifyPayment(orderId, sessionId);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export { createCheckoutSession, handleWebhook, verifyPayment };
