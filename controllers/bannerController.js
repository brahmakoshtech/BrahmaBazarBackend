import Banner from '../models/Banner.js';

// @desc    Create a new banner
// @route   POST /api/banners
// @access  Private/Admin
const createBanner = async (req, res) => {
    try {
        const { title, link, position, displayOrder } = req.body;
        let image = req.body.image;

        if (req.file) {
            image = req.file.path;
        }

        const banner = await Banner.create({
            title,
            image,
            link,
            position,
            displayOrder,
        });

        res.status(201).json(banner);
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
        res.json(banners);
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
        res.json(banners);
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
                banner.image = req.file.path;
            } else if (req.body.image) {
                // Allow updating image URL manually if needed, distinct from file upload
                banner.image = req.body.image;
            }

            const updatedBanner = await banner.save();
            res.json(updatedBanner);
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
