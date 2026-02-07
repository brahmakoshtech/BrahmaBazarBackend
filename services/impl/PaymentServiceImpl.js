import Stripe from 'stripe';
import OrderRepository from '../../repositories/OrderRepository.js';
import UserAddress from '../../models/UserAddress.js';

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

    async createCheckoutSession(orderId, cartItems, addressId, userId) {
        if (!addressId) {
            throw new Error('Please select delivery address');
        }
        // 1. Fetch Order Source of Truth
        const order = await OrderRepository.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Fetch Address for Display
        const address = await UserAddress.findById(addressId);
        const addressStr = address ? `Ship to: ${address.fullName}, ${address.city}, ${address.pincode}` : 'Shipping Address Selected';

        // 2. Prepare Single Line Item for Exact Amount Match
        // formatting the description to include products and address
        const productDetails = order.products.map(p => `${p.title} (x${p.quantity})`).join(', ');

        let lineItemName = `Order #${order._id.toString().slice(-6).toUpperCase()}`;
        let lineItemDescription = `Items: ${productDetails} | ${addressStr}`;

        // Ensure description doesn't exceed Stripe limit (500 chars)
        if (lineItemDescription.length > 500) {
            lineItemDescription = lineItemDescription.substring(0, 497) + '...';
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
                unit_amount: unitAmount,
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
            customer_email: order.user?.email, // Pre-fill user email
            line_items,
            mode: 'payment',
            success_url: `${clientUrl}/order-success/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${clientUrl}/cart`,
            metadata: {
                orderId: orderId.toString(),
                addressId: addressId ? addressId.toString() : null,
                userId: userId ? userId.toString() : null,
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
            const addressId = session.metadata.addressId;

            console.log("ADDRESS ID:", addressId);

            if (orderId) {
                const updateData = {
                    paymentStatus: 'Paid',
                    paidAt: Date.now(),
                    paymentIntentId: session.payment_intent
                };

                // Fetch and snapshot address if addressId is present
                if (addressId) {
                    try {
                        const address = await UserAddress.findById(addressId);
                        if (address) {
                            updateData.shippingAddress = {
                                fullName: address.fullName,
                                phone: address.phone,
                                address: address.addressLine1 + (address.addressLine2 ? ', ' + address.addressLine2 : ''),
                                city: address.city,
                                state: address.state,
                                postalCode: address.pincode, // Mapping UserAddress.pincode to Order.postalCode
                                country: address.country
                            };
                        }
                    } catch (addrErr) {
                        console.error(`Failed to fetch address ${addressId} for order ${orderId}:`, addrErr);
                        // Start: 591 USER_REQUEST
                    }
                }

                await OrderRepository.update(orderId, updateData);
                console.log(`Order ${orderId} marked as paid`);
            }
        }

        return true;
    }
}

export default new PaymentServiceImpl();
