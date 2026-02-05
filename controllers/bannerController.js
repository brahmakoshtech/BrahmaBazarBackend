import Banner from '../models/Banner.js';
import { generateSignedUrl, extractKeyFromUrl } from '../utils/s3Signer.js';

// Helper to sign banner
const signBanner = async (banner) => {
    if (!banner) return banner;
    const signedBanner = banner.toObject ? banner.toObject() : { ...banner };
    if (signedBanner.image) {
        signedBanner.image = await generateSignedUrl(signedBanner.image);
    }
    return signedBanner;
};

// @desc    Create a new banner
// @route   POST /api/banners
// @access  Private/Admin
const createBanner = async (req, res) => {
    try {
        const { title, link, position, displayOrder } = req.body;
        let image = req.body.image;

        if (image) image = extractKeyFromUrl(image);

        if (req.file) {
            image = req.file.key; // Store KEY
        }

        const banner = await Banner.create({
            title,
            image,
            link,
            position,
            displayOrder,
        });

        const signedBanner = await signBanner(banner);
        res.status(201).json(signedBanner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get banners by position (Public)
// @route   GET /api/banners
// @access  Public
const getBanners = async (req, res) => {
    try {
        const { position } = req.query;
        const query = { isActive: true };
        if (position) query.position = position;

        const banners = await Banner.find(query).sort({ displayOrder: 1, createdAt: -1 });
        const signedBanners = await Promise.all(banners.map(signBanner));
        res.json(signedBanners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all banners (Admin)
// @route   GET /api/banners/admin
// @access  Private/Admin
const getAdminBanners = async (req, res) => {
    try {
        const banners = await Banner.find({}).sort({ createdAt: -1 });
        const signedBanners = await Promise.all(banners.map(signBanner));
        res.json(signedBanners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
const updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (banner) {
            banner.title = req.body.title || banner.title;
            banner.link = req.body.link || banner.link;
            banner.position = req.body.position || banner.position;
            banner.displayOrder = req.body.displayOrder || banner.displayOrder;
            if (req.body.isActive !== undefined) banner.isActive = req.body.isActive;

            if (req.file) {
                banner.image = req.file.key; // Store KEY
            } else if (req.body.image) {
                banner.image = extractKeyFromUrl(req.body.image);
            }

            const updatedBanner = await banner.save();
            const signedBanner = await signBanner(updatedBanner);
            res.json(signedBanner);
        } else {
            res.status(404).json({ message: 'Banner not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (banner) {
            await banner.deleteOne();
            res.json({ message: 'Banner removed' });
        } else {
            res.status(404).json({ message: 'Banner not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    createBanner,
    getBanners,
    getAdminBanners,
    updateBanner,
    deleteBanner
};
