import Remedies from '../models/Remedies.js';
import Product from '../models/Product.js';
import RemedyType from '../models/RemedyType.js';
import RemedyBanner from '../models/RemedyBanner.js';
import { signUrls, extractKeyFromUrl } from '../utils/s3Signer.js';

// Helper to sign product images within a remedy
const signRemedyProduct = async (remedy) => {
    if (!remedy || !remedy.product) return remedy;

    // Convert to object if it's a mongoose doc to allow modification
    const remedyObj = remedy.toObject ? remedy.toObject() : { ...remedy };

    if (remedyObj.product && remedyObj.product.images && remedyObj.product.images.length > 0) {
        remedyObj.product.images = await signUrls(remedyObj.product.images);
    }
    return remedyObj;
};

// @desc    Get all remedy types
// @route   GET /api/admin/remedies/types
// @access  Private/Admin
const getRemedyTypes = async (req, res) => {
    try {
        const types = await RemedyType.find({});
        // Always include default types if empty (optional safety)
        if (types.length === 0) {
            const defaults = [
                { name: 'Shop', slug: 'shop' },
                { name: 'Yatra', slug: 'yatra' },
                { name: 'Seva', slug: 'seva' }
            ];
            const createdDefaults = await RemedyType.insertMany(defaults);
            return res.json(createdDefaults);
        }
        res.json(types);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a new remedy type
// @route   POST /api/admin/remedies/types
// @access  Private/Admin
const addRemedyType = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Type name is required' });

        const slug = name.toLowerCase().replace(/ /g, '-');

        const existing = await RemedyType.findOne({ slug });
        if (existing) return res.status(400).json({ message: 'Type already exists' });

        const type = await RemedyType.create({ name, slug });
        res.status(201).json(type);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new remedy (AND Product)
// @route   POST /api/admin/remedies
// @access  Private/Admin
const addRemedy = async (req, res) => {
    try {
        const { type, section, title, description, price, stock, category, subcategory } = req.body;
        let image = req.body.image;

        if (req.file) {
            image = req.file.key;
        }

        // Validation
        if (!type || !section || !title) {
            return res.status(400).json({ message: 'Type, Section, and Title are required' });
        }

        // 1. Create Product First
        // Ensure we store S3 keys, not full URLs
        let productImages = image ? [image] : [];
        productImages = productImages.map(img => extractKeyFromUrl(img));

        const productData = {
            title,
            description: description || title,
            price: price || 0, // Default to 0 if optional
            stock: stock || 1,
            category: category || 'Remedies', // Default category
            subcategory: subcategory || type,
            images: productImages
        };

        const product = await Product.create(productData);

        // 2. Create Remedy Entry linked to Product
        const remedy = await Remedies.create({
            type, // slug string
            section, // must_have / good_to_have
            product: product._id
        });

        await remedy.populate('product', 'title price images stock category subcategory');
        const signedRemedy = await signRemedyProduct(remedy);

        res.status(201).json(signedRemedy);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get remedies with filters
// @route   GET /api/admin/remedies?type=shop&section=must_have
// @access  Private/Admin
const getRemedies = async (req, res) => {
    try {
        const { type, section } = req.query;

        const query = {};
        if (type) query.type = type;
        if (section) query.section = section;

        const remedies = await Remedies.find(query)
            .populate('product', 'title price images stock category subcategory')
            .sort({ createdAt: -1 });

        const signedRemedies = await Promise.all(remedies.map(signRemedyProduct));

        res.json(signedRemedies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove a remedy AND its linked Product
// @route   DELETE /api/admin/remedies/:id
// @access  Private/Admin
// @desc    Add existing product as a Remedy
// @route   POST /api/admin/remedies/add-from-product
// @access  Private/Admin
const addRemedyFromProduct = async (req, res) => {
    try {
        const { productId, type, tag } = req.body;

        if (!productId || !type || !tag) {
            return res.status(400).json({ message: 'Product ID, Type, and Tag are required' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if this product is already a remedy for this type
        const existing = await Remedies.findOne({ product: productId, type });
        if (existing) {
            return res.status(400).json({ message: 'This product is already added to this remedy type' });
        }

        // Create Remedy Entry
        const remedy = await Remedies.create({
            type, // slug string
            section: tag, // "must_have" or "good_to_have"
            product: productId
        });

        await remedy.populate('product', 'title price images stock category subcategory');
        const signedRemedy = await signRemedyProduct(remedy);

        res.status(201).json(signedRemedy);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteRemedy = async (req, res) => {
    try {
        const remedy = await Remedies.findById(req.params.id);

        if (remedy) {
            // Delete linked Product first
            if (remedy.product) {
                await Product.findByIdAndDelete(remedy.product);
            }

            // Delete Remedy
            await remedy.deleteOne();
            res.json({ message: 'Remedy and linked Product removed' });
        } else {
            res.status(404).json({ message: 'Remedy not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getBanners = async (req, res) => {
    try {
        const { type } = req.query;
        const query = type && type !== 'all' ? { type } : {};
        const banners = await RemedyBanner.find(query).sort({ order: 1, createdAt: -1 });
        // Sign URLs
        const signedBanners = await Promise.all(banners.map(async (b) => {
            const bObj = b.toObject();
            if (bObj.image) {
                const [signed] = await signUrls([bObj.image]);
                bObj.image = signed;
            }
            return bObj;
        }));
        res.json(signedBanners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addBanner = async (req, res) => {
    try {
        const { title, description, isActive } = req.body;
        let image = req.body.image;
        if (req.file) {
            image = req.file.key;
        }

        if (!image) {
            return res.status(400).json({ message: 'Image is required' });
        }

        // Extract key if URL provided
        image = extractKeyFromUrl(image);

        const banner = await RemedyBanner.create({
            image,
            title,
            description,
            type: req.body.type || 'shop',
            isActive: isActive === 'true' || isActive === true
        });

        res.status(201).json(banner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteRemedyBanner = async (req, res) => {
    try {
        const banner = await RemedyBanner.findById(req.params.id);
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

const toggleRemedyBanner = async (req, res) => {
    try {
        const banner = await RemedyBanner.findById(req.params.id);
        if (banner) {
            banner.isActive = !banner.isActive;
            await banner.save();
            res.json(banner);
        } else {
            res.status(404).json({ message: 'Banner not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateBanner = async (req, res) => {
    try {
        const { title, description, isActive, order } = req.body;
        const banner = await RemedyBanner.findById(req.params.id);

        if (banner) {
            banner.title = title || banner.title;
            banner.description = description || banner.description;
            if (req.body.type) banner.type = req.body.type;
            if (isActive !== undefined) banner.isActive = isActive === 'true' || isActive === true;
            if (order !== undefined) banner.order = Number(order);

            if (req.file) {
                banner.image = req.file.key;
            } else if (req.body.image) {
                // If a new URL is provided (less likely, but possible)
                banner.image = extractKeyFromUrl(req.body.image);
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

const getForYouLayout = async (req, res) => {
    try {
        const { type } = req.query; // Filter by remedy type (e.g., 'shop', 'seva')

        // 1. Fetch Remedies
        const remedyQuery = {};
        if (type) remedyQuery.type = type;

        const remedies = await Remedies.find(remedyQuery)
            .populate('product', 'title price images stock category subcategory')
            .sort({ createdAt: -1 });

        const signedRemedies = await Promise.all(remedies.map(signRemedyProduct));

        // Group remedies
        const goodToHave = signedRemedies.filter(r => r.section !== 'must_have' && r.section !== 'must_to_have');
        const mustHave = signedRemedies.filter(r => r.section === 'must_have' || r.section === 'must_to_have');

        // 2. Fetch Active Banners
        const bannerQuery = { isActive: { $ne: false } };
        if (type) {
            const typeRegex = new RegExp(`^${type}$`, 'i');
            if (type.toLowerCase() === 'shop') {
                bannerQuery.$or = [
                    { type: typeRegex },
                    { type: '' },
                    { type: { $exists: false } },
                    { type: null }
                ];
            } else {
                bannerQuery.type = typeRegex;
            }
        }
        const banners = await RemedyBanner.find(bannerQuery).sort({ order: 1 });
        const signedBanners = await Promise.all(banners.map(async (b) => {
            const bObj = b.toObject();
            if (bObj.image) {
                const [signed] = await signUrls([bObj.image]);
                bObj.image = signed;
            }
            return bObj;
        }));

        // 3. Construct Layout strictly
        const layout = [
            {
                id: 'section_good_to_have',
                type: 'good_to_have',
                title: 'Good To Have',
                data: goodToHave
            },
            {
                id: 'section_banner_slider',
                type: 'banner_slider',
                title: 'Highlights',
                data: signedBanners
            },
            {
                id: 'section_must_have',
                type: 'must_have',
                title: 'Must Have',
                data: mustHave
            }
        ];

        res.json(layout);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    addRemedy,
    getRemedies,
    deleteRemedy,
    getRemedyTypes,
    addRemedyType,
    addRemedyFromProduct,
    getBanners,
    addBanner,
    deleteRemedyBanner,
    toggleRemedyBanner,
    updateBanner,
    getForYouLayout
};
