import CartServiceImpl from '../services/impl/CartServiceImpl.js';
import { signUrls } from '../utils/s3Signer.js';

// Helper to sign cart items
const signCart = async (cart) => {
    if (!cart) return [];
    return await Promise.all(cart.map(async (item) => {
        const itemObj = item.toObject ? item.toObject() : { ...item };
        if (itemObj.product && itemObj.product.images) {
            itemObj.product.images = await signUrls(itemObj.product.images);
        }
        return itemObj;
    }));
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const user = await CartServiceImpl.addToCart(req.user._id, productId, quantity);
        const signedCart = await signCart(user.cart);
        res.status(200).json(signedCart);
    } catch (error) {
        const statusCode = error.message === 'Product not found' ? 404 : 400;
        res.status(statusCode).json({ message: error.message });
    }
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
    try {
        const cart = await CartServiceImpl.getCart(req.user._id);
        const signedCart = await signCart(cart);
        res.json(signedCart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItem = async (req, res) => {
    try {
        const { quantity } = req.body;
        const productId = req.params.productId || req.body.productId;
        const cart = await CartServiceImpl.updateCartItem(req.user._id, productId, quantity);
        const signedCart = await signCart(cart);
        res.json(signedCart);
    } catch (error) {
        const statusCode = error.message === 'Item not found in cart' ? 404 : 400;
        res.status(statusCode).json({ message: error.message });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:productId
// @access  Private
const removeCartItem = async (req, res) => {
    try {
        const cart = await CartServiceImpl.removeCartItem(req.user._id, req.params.productId);
        const signedCart = await signCart(cart);
        res.json(signedCart);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export { addToCart, getCart, updateCartItem, removeCartItem };
