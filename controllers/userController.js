import asyncHandler from 'express-async-handler';
import UserServiceImpl from '../services/impl/UserServiceImpl.js';
import { generateSignedUrl, signUrls } from '../utils/s3Signer.js';

const signUser = async (user) => {
    if (!user) return user;
    const u = user.toObject ? user.toObject() : { ...user };
    if (u.avatar) u.avatar = await generateSignedUrl(u.avatar);
    return u;
};

const signWishlist = async (wishlist) => {
    if (!wishlist) return [];
    return await Promise.all(wishlist.map(async (p) => {
        let product = p.toObject ? p.toObject() : { ...p };
        if (product.images) product.images = await signUrls(product.images);
        return product;
    }));
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    try {
        const users = await UserServiceImpl.getAllUsers();
        const signedUsers = await Promise.all(users.map(signUser));
        res.json(signedUsers);
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    try {
        await UserServiceImpl.deleteUser(req.params.id);
        res.json({ message: 'User removed' });
    } catch (error) {
        res.status(404);
        throw new Error(error.message);
    }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
    try {
        const user = await UserServiceImpl.getUserById(req.params.id);
        const signedUser = await signUser(user);
        res.json(signedUser);
    } catch (error) {
        res.status(404);
        throw new Error(error.message);
    }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
    try {
        const updatedUser = await UserServiceImpl.updateUser(req.params.id, req.body);
        const signedUser = await signUser(updatedUser);
        res.json(signedUser);
    } catch (error) {
        res.status(404);
        throw new Error(error.message);
    }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    try {
        const user = await UserServiceImpl.getUserProfile(req.user._id);
        const signedUser = await signUser(user);
        res.json(signedUser);
    } catch (error) {
        res.status(404);
        throw new Error(error.message);
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    try {
        const updatedUser = await UserServiceImpl.updateUserProfile(req.user._id, req.body);
        const signedUser = await signUser(updatedUser);
        res.json(signedUser);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

// @desc    Add to wishlist
// @route   POST /api/users/wishlist
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
    try {
        const { productId } = req.body;
        const wishlist = await UserServiceImpl.addToWishlist(req.user._id, productId);
        const signedWishlist = await signWishlist(wishlist);
        res.json(signedWishlist);
    } catch (error) {
        res.status(400); // 400 Bad Request
        throw new Error(error.message);
    }
});

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
    try {
        const wishlist = await UserServiceImpl.getWishlist(req.user._id);
        const signedWishlist = await signWishlist(wishlist);
        res.json(signedWishlist);
    } catch (error) {
        res.status(404);
        throw new Error(error.message);
    }
});

// @desc    Remove from wishlist
// @route   DELETE /api/users/wishlist/:id
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
    try {
        const wishlist = await UserServiceImpl.removeFromWishlist(req.user._id, req.params.id);
        const signedWishlist = await signWishlist(wishlist);
        res.json(signedWishlist);
    } catch (error) {
        res.status(404);
        throw new Error(error.message);
    }
});

// @desc    Initialize Developer Role
// @route   POST /api/users/developer-init
// @access  Private
const initDeveloper = asyncHandler(async (req, res) => {
    try {
        const { secretKey } = req.body;
        const user = await UserServiceImpl.initDeveloper(req.user._id, secretKey);
        res.json(user);
    } catch (error) {
        res.status(401);
        throw new Error(error.message);
    }
});

export {
    getUsers,
    deleteUser,
    getUserById,
    updateUser,
    getUserProfile,
    updateUserProfile,
    addToWishlist,
    getWishlist,
    removeFromWishlist,
    initDeveloper
};
