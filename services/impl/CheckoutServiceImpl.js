import UserRepository from '../../repositories/UserRepository.js';
import ProductRepository from '../../repositories/ProductRepository.js';
import OrderRepository from '../../repositories/OrderRepository.js';
import Coupon from '../../models/Coupon.js';

class CheckoutServiceImpl {
    async checkout(userId, shippingAddress, paymentMethod, couponCode) {
        // console.log(`[Checkout] Starting for User ${userId} with Coupon: ${couponCode}`);
        const user = await UserRepository.findById(userId);
        // Need to populate to check prices/stock
        await user.populate('cart.product');

        if (!user.cart || user.cart.length === 0) {
            throw new Error('Cart is empty');
        }

        let orderItems = [];
        let totalPrice = 0;

        for (const item of user.cart) {
            // Using ProductRepo to ensure we get fresh data
            const product = await ProductRepository.findById(item.product._id);

            if (!product) {
                throw new Error(`Product not found: ${item.product._id}`);
            }

            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.title}`);
            }

            orderItems.push({
                product: product._id,
                title: product.title,
                price: product.price,
                quantity: item.quantity,
                image: product.images[0] || '',
                productId: product._id,
                category: product.category || '',
                subcategory: product.subcategory || ''
            });

            totalPrice += product.price * item.quantity;

            // Stock deduction could happen here
        }


        let discountAmount = 0;

        if (couponCode) {
            const normalizedCode = String(couponCode).toUpperCase();
            const coupon = await Coupon.findOne({ code: normalizedCode });
            console.log(`[Checkout] Processing Coupon: ${normalizedCode}`);

            if (!coupon) {
                throw new Error(`Coupon '${couponCode}' invalid or not found`);
            }

            if (!coupon.isActive) {
                throw new Error(`Coupon '${couponCode}' is not active`);
            }

            if (new Date() > new Date(coupon.expiryDate)) {
                throw new Error(`Coupon '${couponCode}' has expired`);
            }

            // Validate usage limit if needed
            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                throw new Error(`Coupon '${couponCode}' usage limit exceeded`);
            }

            // Calculate eligible amount
            let eligibleTotal = 0;
            if (coupon.applicableCategory) {
                // Check items for category
                const eligibleItems = orderItems.filter(item => {
                    if (item.category && coupon.applicableCategory) {
                        const itemCat = item.category.trim().toLowerCase();
                        const couponCat = coupon.applicableCategory.trim().toLowerCase();
                        if (itemCat === couponCat) {
                            if (coupon.applicableSubcategory) {
                                const itemSub = item.subcategory ? item.subcategory.trim().toLowerCase() : '';
                                const couponSub = coupon.applicableSubcategory.trim().toLowerCase();
                                return itemSub === couponSub;
                            }
                            return true;
                        }
                    }
                    return false;
                });

                eligibleTotal = eligibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                if (eligibleTotal === 0) {
                    throw new Error(`Coupon '${couponCode}' is not applicable to any items in your cart`);
                }

            } else {
                eligibleTotal = totalPrice;
            }

            if (eligibleTotal > 0) {
                if (coupon.discountType === 'percentage') {
                    discountAmount = (eligibleTotal * coupon.discountValue) / 100;
                    if (coupon.maxDiscountAmount) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
                } else {
                    discountAmount = coupon.discountValue;
                    // Cap flat discount at eligible total
                    if (discountAmount > eligibleTotal) discountAmount = eligibleTotal;
                }
            }
        }

        // console.log(`[Checkout] Discount Calculated: ${discountAmount}`);

        const taxableAmount = Math.max(0, totalPrice - discountAmount);
        const gstAmount = Math.round(taxableAmount * 0.18);
        const finalAmount = Math.round(taxableAmount + gstAmount);

        const orderData = {
            user: userId,
            products: orderItems,
            shippingAddress,
            paymentMethod,
            paymentStatus: 'Pending',
            totalAmount: totalPrice, // Subtotal
            couponCode: couponCode,
            discountAmount: discountAmount,
            finalAmount: finalAmount,
            taxAmount: gstAmount
        };

        const createdOrder = await OrderRepository.create(orderData);

        // Clear cart
        user.cart = [];
        await UserRepository.save(user);

        return createdOrder;
    }
}

export default new CheckoutServiceImpl();
