import Coupon from '../models/Coupon.js';

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res) => {
    try {
        const {
            code,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscountAmount,
            expiryDate,
            usageLimit,
            applicableCategory,
            applicableSubcategory
        } = req.body;

        const couponExists = await Coupon.findOne({ code: code.toUpperCase() });

        if (couponExists) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscountAmount,
            expiryDate,
            usageLimit,
            applicableCategory,
            applicableSubcategory,
            createdBy: req.user._id,
        });

        res.status(201).json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({}).sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);

        if (coupon) {
            coupon.code = req.body.code?.toUpperCase() || coupon.code;
            coupon.discountType = req.body.discountType || coupon.discountType;
            coupon.discountValue = req.body.discountValue || coupon.discountValue;
            coupon.minOrderAmount = req.body.minOrderAmount || coupon.minOrderAmount;
            coupon.maxDiscountAmount = req.body.maxDiscountAmount || coupon.maxDiscountAmount;
            coupon.expiryDate = req.body.expiryDate || coupon.expiryDate;
            coupon.usageLimit = req.body.usageLimit || coupon.usageLimit;

            // Update Category targeting (allow setting to null if explicitly sent as null/empty)
            if (req.body.applicableCategory !== undefined) coupon.applicableCategory = req.body.applicableCategory;
            if (req.body.applicableSubcategory !== undefined) coupon.applicableSubcategory = req.body.applicableSubcategory;

            // isActive is handled separately or can be updated here too if needed
            if (req.body.isActive !== undefined) {
                coupon.isActive = req.body.isActive;
            }

            const updatedCoupon = await coupon.save();
            res.json(updatedCoupon);
        } else {
            res.status(404).json({ message: 'Coupon not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Update failed', error: error.message });
    }
};

// @desc    Disable coupon (Soft Delete)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const disableCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);

        if (coupon) {
            coupon.isActive = false;
            await coupon.save();
            res.json({ message: 'Coupon disabled' });
        } else {
            res.status(404).json({ message: 'Coupon not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Validate and Apply Coupon
// @route   POST /api/coupons/apply
// @access  Private
const applyCoupon = async (req, res) => {
    const { couponCode, cartTotal } = req.body;

    if (!couponCode || !cartTotal) {
        return res.status(400).json({ message: 'Missing coupon code or cart total' });
    }

    try {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid coupon code' });
        }

        // 1. Check if active
        if (!coupon.isActive) {
            return res.status(400).json({ message: 'Coupon is inactive' });
        }

        // 2. Check Expiry
        if (new Date() > new Date(coupon.expiryDate)) {
            return res.status(400).json({ message: 'Coupon has expired' });
        }

        // 3. Check Usage Limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: 'Coupon usage limit exceeded' });
        }

        // 4. Check Min Order Amount (Based on Total Cart Value usually)
        if (cartTotal < coupon.minOrderAmount) {
            return res.status(400).json({
                message: `Minimum order amount of ₹${coupon.minOrderAmount} required`
            });
        }

        let eligibleAmount = 0;
        let eligibleItemsCount = 0;

        // Calculate Eligible Amount based on restrictions
        const cartItems = req.body.cartItems || []; // Expect cartItems for targeted calculation

        if (coupon.applicableCategory) {
            if (!cartItems || cartItems.length === 0) {
                // If checking blindly without items, we can't validate category. 
                // But for a robust implementation, we assume if category is set, we strictly need items.
                // However, to keep backward compat (if any), if no items sent but total sent, maybe fail or assume full? 
                // Better to fail or return 0 discount if it's targeted but no items data.
                if (cartTotal > 0) {
                    return res.status(400).json({ message: 'Cart items required for category-specific coupon' });
                }
            }

            // Filter items
            cartItems.forEach(item => {
                const product = item.product || {};
                const prodCategory = product.category || '';
                const prodSubcategory = product.subcategory || ''; // Assuming product has subcategory field populated or stored

                // Check Category Match
                // Use precise matching or includes for flexibility. 
                // The prompt says "target any category or sub-category".
                // Usually direct match.

                let isMatch = false;

                // Check Main Category
                if (prodCategory.toLowerCase() === coupon.applicableCategory.toLowerCase()) {
                    isMatch = true;
                    // If Subcategory is ALSO specified, it must match that too (Narrowing down) 
                    // OR does it mean Category OR Subcategory? Usually Hierarchy: Category AND (Subcategory if set).
                    if (coupon.applicableSubcategory) {
                        if (prodSubcategory.toLowerCase() !== coupon.applicableSubcategory.toLowerCase()) {
                            isMatch = false;
                        }
                    }
                }

                if (isMatch) {
                    eligibleAmount += (product.price * item.quantity);
                    eligibleItemsCount += item.quantity;
                }
            });

            if (eligibleAmount === 0) {
                return res.status(400).json({
                    message: `This coupon is only valid for ${coupon.applicableCategory} ${coupon.applicableSubcategory ? `(${coupon.applicableSubcategory})` : ''} items.`
                });
            }

        } else {
            // No category restriction -> Full cart is eligible
            eligibleAmount = cartTotal;
        }


        // Calculate Discount
        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = (eligibleAmount * coupon.discountValue) / 100;
            // Apply Max Discount Cap if exists
            if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                discountAmount = coupon.maxDiscountAmount;
            }
        } else if (coupon.discountType === 'flat') {
            // Flat discount generally applies once per order, NOT per item.
            // But if it's targeted? Usually "Get 500 off on Shoes". 
            // If I buy only shoes worth 1000, I get 500 off. 
            // If I buy Shoes (1000) and Hat (200), I still get 500 off (capped by eligible amount?).
            // Let's assume Flat Discount applies to the Eligible Total, capped by Eligible Total.
            discountAmount = coupon.discountValue;
            if (discountAmount > eligibleAmount) {
                discountAmount = eligibleAmount;
            }
        }

        // Final safety check
        if (discountAmount > cartTotal) {
            discountAmount = cartTotal;
        }

        const finalAmount = cartTotal - discountAmount;

        res.json({
            couponCode: coupon.code,
            discountAmount,
            finalAmount,
            message: 'Coupon applied successfully'
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get active coupons (Public)
// @route   GET /api/coupons/active
// @access  Public
const getActiveCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({
            isActive: true,
            expiryDate: { $gte: new Date() }
        }).select('-usedCount -createdBy -createdAt -updatedAt'); // Exclude internal fields
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    createCoupon,
    getCoupons,
    getActiveCoupons,
    updateCoupon,
    disableCoupon,
    applyCoupon
};
