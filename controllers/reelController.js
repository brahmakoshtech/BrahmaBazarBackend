import asyncHandler from 'express-async-handler';
import Reel from '../models/Reel.js';

// @desc    Upload a new reel
// @route   POST /api/reels/upload
// @access  Private/Admin
const createReel = asyncHandler(async (req, res) => {
    const { title } = req.body;

    if (!req.file) {
        res.status(400);
        throw new Error('No video file uploaded');
    }

    const reel = await Reel.create({
        title,
        videoUrl: req.file.location, // S3 URL
        isActive: true
    });

    res.status(201).json(reel);
});

// @desc    Get all active reels
// @route   GET /api/reels
// @access  Public
const getReels = asyncHandler(async (req, res) => {
    const reels = await Reel.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(reels);
});

// @desc    Get all reels (Admin)
// @route   GET /api/reels/admin
// @access  Private/Admin
const getAdminReels = asyncHandler(async (req, res) => {
    const reels = await Reel.find({}).sort({ createdAt: -1 });
    res.json(reels);
});

// @desc    Delete a reel
// @route   DELETE /api/reels/:id
// @access  Private/Admin
const deleteReel = asyncHandler(async (req, res) => {
    const reel = await Reel.findById(req.params.id);

    if (reel) {
        await reel.deleteOne();
        res.json({ message: 'Reel removed' });
    } else {
        res.status(404);
        throw new Error('Reel not found');
    }
});

// @desc    Toggle reel status
// @route   PATCH /api/reels/:id/toggle
// @access  Private/Admin
const toggleReelStatus = asyncHandler(async (req, res) => {
    const reel = await Reel.findById(req.params.id);

    if (reel) {
        reel.isActive = !reel.isActive;
        const updatedReel = await reel.save();
        res.json(updatedReel);
    } else {
        res.status(404);
        throw new Error('Reel not found');
    }
});

export {
    createReel,
    getReels,
    getAdminReels,
    deleteReel,
    toggleReelStatus
};
