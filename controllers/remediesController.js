import Remedies from '../models/Remedies.js';
import Product from '../models/Product.js';
import RemedyType from '../models/RemedyType.js';
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

export {
    addRemedy,
    getRemedies,
    deleteRemedy,
    getRemedyTypes,
    addRemedyType,
    addRemedyFromProduct
};
