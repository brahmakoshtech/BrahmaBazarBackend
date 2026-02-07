import Remedies from '../models/Remedies.js';
import Product from '../models/Product.js';
import { signUrls } from '../utils/s3Signer.js';

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

// @desc    Add a product to remedies
// @route   POST /api/admin/remedies
// @access  Private/Admin
const addRemedy = async (req, res) => {
    try {
        const { type, section, productId } = req.body;

        if (!['must_have', 'good_to_have'].includes(section)) {
            return res.status(400).json({ message: 'Invalid section' });
        }
        if (!['shop', 'yatra', 'seva'].includes(type)) {
            return res.status(400).json({ message: 'Invalid type' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if already exists in this specific type and section
        const existingRemedy = await Remedies.findOne({ type, section, product: productId });
        if (existingRemedy) {
            return res.status(400).json({ message: 'Product already in this remedy section' });
        }

        const remedy = new Remedies({
            type,
            section,
            product: productId
        });

        const createdRemedy = await remedy.save();
        // Populate product details for frontend convenience
        await createdRemedy.populate('product', 'title price images stock category subcategory');

        const signedRemedy = await signRemedyProduct(createdRemedy);
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

        const remedies = await Remedies.find(query).populate('product', 'title price images stock category subcategory');

        const signedRemedies = await Promise.all(remedies.map(signRemedyProduct));

        res.json(signedRemedies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove a remedy
// @route   DELETE /api/admin/remedies/:id
// @access  Private/Admin
const deleteRemedy = async (req, res) => {
    try {
        const remedy = await Remedies.findById(req.params.id);

        if (remedy) {
            await remedy.deleteOne();
            res.json({ message: 'Remedy removed' });
        } else {
            res.status(404).json({ message: 'Remedy not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { addRemedy, getRemedies, deleteRemedy };
