import Category from '../models/Category.js';

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
    try {
        const { name, slug, description, image, subcategories } = req.body;

        // Auto-generate slug if not provided
        const categorySlug = slug || name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const categoryExists = await Category.findOne({ slug: categorySlug });
        if (categoryExists) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        // Process subcategories if present
        let processedSubcategories = [];
        if (subcategories && Array.isArray(subcategories)) {
            processedSubcategories = subcategories.map(sub => ({
                name: sub.name,
                slug: sub.slug || sub.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
                image: sub.image || '',
                isActive: true
            }));
        }

        const category = await Category.create({
            name,
            slug: categorySlug,
            description,
            image,
            subcategories: processedSubcategories
        });

        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all categories (Admin)
// @route   GET /api/categories/admin
// @access  Private/Admin
const getAdminCategories = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ createdAt: -1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (category) {
            category.name = req.body.name || category.name;
            if (req.body.name && !req.body.slug) {
                // Update slug only if name changes and no specific slug provided? 
                // Usually simpler to keep slug stable or explicit update.
                // keeping stable unless explicit.
            }
            if (req.body.slug) category.slug = req.body.slug;

            category.description = req.body.description || category.description;
            category.image = req.body.image || category.image;
            if (req.body.isActive !== undefined) category.isActive = req.body.isActive;

            const updatedCategory = await category.save();
            res.json(updatedCategory);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (category) {
            await category.deleteOne();
            res.json({ message: 'Category removed' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add subcategory
// @route   POST /api/categories/:id/subcategories
// @access  Private/Admin
const addSubcategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (category) {
            const { name, image } = req.body;
            // distinct slug
            const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

            const subcategoryExists = category.subcategories.find(sub => sub.slug === slug);

            if (subcategoryExists) {
                return res.status(400).json({ message: 'Subcategory already exists' });
            }

            const subcategory = {
                name,
                slug,
                image,
                isActive: true
            };

            category.subcategories.push(subcategory);
            await category.save();

            res.status(201).json(category);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export {
    createCategory,
    getCategories,
    getAdminCategories,
    updateCategory,
    deleteCategory,
    addSubcategory
};
