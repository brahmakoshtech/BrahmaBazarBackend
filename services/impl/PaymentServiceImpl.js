import Stripe from 'stripe';
import OrderRepository from '../../repositories/OrderRepository.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class PaymentServiceImpl {
    async verifyPayment(orderId, sessionId) {
        try {
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            if (session.payment_status === 'paid') {
                const updateData = {
                    paymentStatus: 'Paid',
                    paidAt: Date.now(),
                    paymentIntentId: session.payment_intent
                };

                await OrderRepository.update(orderId, updateData);
                return { success: true, message: 'Payment verified and order updated' };
            } else {
                return { success: false, message: 'Payment not completed yet' };
            }
        } catch (error) {
            console.error('Verify Payment Error:', error);
            throw new Error('Payment verification failed');
        }
    }

    async createCheckoutSession(orderId, cartItems) { // cartItems is ignored, we use order source of truth
        // 1. Fetch Order Source of Truth
        const order = await OrderRepository.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // 2. Prepare Single Line Item for Exact Amount Match
        // We use a single line item to ensure the final amount (with coupons/taxes) is exactly what is charged.
        // We will make the text descriptive so the user knows what they are paying for.

        const productNames = order.products.map(p => p.title).join(', ');

        let lineItemName = `Payment for Order #${order._id.toString().slice(-6).toUpperCase()}`;
        let lineItemDescription = `Included Tax & Discounts | Items: ${productNames}`;

        // If it's a single item, we can be more specific in the title
        if (order.products.length === 1) {
            lineItemName = order.products[0].title;
            lineItemDescription = `Quantity: ${order.products[0].quantity} | Included Tax & Discounts`;
        } else if (lineItemDescription.length > 500) {
            // Truncate if too long
            lineItemDescription = `Total Items: ${order.products.length} | Included Tax & Discounts`;
        }

        const unitAmount = Math.round(order.finalAmount * 100);
        if (unitAmount < 5000) {
            throw new Error('Order total must be at least ₹50 for online payment. Please add more items.');
        }

        const line_items = [{
            price_data: {
                currency: 'inr',
                product_data: {
                    name: lineItemName,
                    description: lineItemDescription,
                    images: order.products.length > 0 && order.products[0].image && order.products[0].image.startsWith('http') ? [order.products[0].image] : [],
                },
                unit_amount: unitAmount, // Convert to paise
            },
            quantity: 1,
        }];

        let clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        if (clientUrl.includes('localhost') && (process.env.NODE_ENV === 'production' || process.env.ON_RENDER === 'true')) {
            clientUrl = 'https://e-comm-2adg.vercel.app';
        }

        // 3. Create Stripe Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${clientUrl}/order-success/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${clientUrl}/cart`,
            metadata: {
                orderId: orderId.toString(),
                basePrice: (order.totalAmount || 0).toString(),
                discountAmount: (order.discountAmount || 0).toString(),
                gstAmount: (order.taxAmount || 0).toString(),
                couponCode: order.couponCode || 'NONE'
            },
        });

        return { id: session.id, url: session.url };
    }

    async handleWebhook(body, signature) {
        let event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            throw new Error(`Webhook Error: ${err.message}`);
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const orderId = session.metadata.orderId;

            if (orderId) {
                // We use update logic. 
                // Since OrderRepository.update takes an object, we first fetch or just partial update if supported.
                // Our Repo update expects (id, updateData).
                const updateData = {
                    paymentStatus: 'Paid',
                    paidAt: Date.now(),
                    paymentIntentId: session.payment_intent
                };

                await OrderRepository.update(orderId, updateData);
                console.log(`Order ${orderId} marked as paid`);
            }
        }

        return true;
    }
}

export default new PaymentServiceImpl();
