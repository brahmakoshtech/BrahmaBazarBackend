import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { signUrls, generateSignedUrl } from '../utils/s3Signer.js';

// Helper to sign a single product's images
const signProduct = async (product) => {
    if (!product) return null;
    if (product.images && product.images.length > 0) {
        product.images = await signUrls(product.images);
    }
    return product;
};

// Helper to sign a list of products
const signProductList = async (products) => {
    if (!products) return [];
    return await Promise.all(products.map(signProduct));
};

// @desc    Get mobile home screen data
// @route   GET /api/mobile/home
// @access  Public
// @desc    Get mobile home screen data
// @route   GET /api/mobile/home
// @access  Public
const getMobileHomeData = asyncHandler(async (req, res) => {
    // 1. Fetch Top Level Lists (Trending, New, Highlighted)
    const [trending, newArrivals, highlighted, allCategories] = await Promise.all([
        Product.find({ isTrending: true })
            .sort({ createdAt: -1 })
            .select('title price images rating numReviews category subcategory')
            .limit(5)
            .lean(),
        Product.find({ isNewArrival: true })
            .sort({ createdAt: -1 })
            .select('title price images rating numReviews category subcategory')
            .limit(5)
            .lean(),
        Product.find({ isHighlighted: true })
            .sort({ highlightPriority: -1 })
            .select('title price images rating numReviews category subcategory')
            .limit(5)
            .lean(),
        Category.find({ isActive: true })
            .select('name slug image subcategories')
            .lean()
    ]);

    // 2. Sign Top Level Product Images
    const [signedTrending, signedNew, signedHigh] = await Promise.all([
        signProductList(trending),
        signProductList(newArrivals),
        signProductList(highlighted)
    ]);

    // 3. Built Full Nested Category Tree with Products
    // Use Promise.all to map over categories in parallel
    const categoriesWithProducts = await Promise.all(allCategories.map(async (cat) => {
        // Sign Category Image
        const signedCatImage = cat.image ? await generateSignedUrl(cat.image) : cat.image;

        // Process Subcategories if they exist
        let processedSubcategories = [];
        if (cat.subcategories && cat.subcategories.length > 0) {
            processedSubcategories = await Promise.all(cat.subcategories
                .filter(sub => sub.isActive !== false) // Handle potential isActive flag on subcats
                .map(async (sub) => {
                    // Sign Subcategory Image
                    const signedSubImage = sub.image ? await generateSignedUrl(sub.image) : sub.image;

                    // Fetch Products for this Subcategory
                    // Performance: Limit to 10 latest products per subcategory to avoid payload bloat
                    const subProducts = await Product.find({
                        category: cat.name,
                        subcategory: sub.name
                    })
                        .sort({ createdAt: -1 })
                        .limit(10)
                        .select('title price images rating numReviews stock')
                        .lean();

                    // Sign Product Images
                    const signedSubProducts = await signProductList(subProducts);

                    return {
                        name: sub.name,
                        slug: sub.slug,
                        image: signedSubImage,
                        products: signedSubProducts
                    };
                })
            );
        }

        return {
            _id: cat._id,
            name: cat.name,
            slug: cat.slug,
            image: signedCatImage,
            subcategories: processedSubcategories
        };
    }));

    res.json({
        trending: signedTrending,
        newArrivals: signedNew,
        highlighted: signedHigh,
        categories: categoriesWithProducts
    });
});

// @desc    Get full category tree
// @route   GET /api/mobile/categories-tree
// @access  Public
const getCategoriesTree = asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true })
        .select('name slug image subcategories')
        .lean();

    // Process categories and sign URLs
    const sanitizedContext = await Promise.all(categories.map(async (cat) => {
        const signedMainImage = cat.image ? await generateSignedUrl(cat.image) : cat.image;

        const signedSubcategories = cat.subcategories
            ? await Promise.all(cat.subcategories
                .filter(sub => sub.isActive !== false)
                .map(async sub => ({
                    name: sub.name,
                    slug: sub.slug,
                    image: sub.image ? await generateSignedUrl(sub.image) : sub.image
                })))
            : [];

        return {
            _id: cat._id,
            name: cat.name,
            slug: cat.slug,
            image: signedMainImage,
            subcategories: signedSubcategories
        };
    }));

    res.json(sanitizedContext);
});

// @desc    Get products with filters & pagination
// @route   GET /api/mobile/products
// @access  Public
const getMobileProducts = asyncHandler(async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.page) || 1;

    let query = {};

    if (req.query.category) {
        // Case insensitive match for category name or slug if stored that way
        // Schema says category is String (name). Frontend might pass slug or name. 
        // Assuming partial flexibility or exact match needed.
        // Let's assume exact match for now as per likely schema usage
        query.category = req.query.category;
    }

    if (req.query.subcategory) {
        query.subcategory = req.query.subcategory;
    }

    if (req.query.keyword) {
        query.title = {
            $regex: req.query.keyword,
            $options: 'i',
        };
    }

    // Only select necessary fields for a list view
    const selectFields = 'title price images rating numReviews category subcategory stock isTrending isNewArrival';

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
        .select(selectFields)
        .sort({ createdAt: -1 }) // Newest first
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .lean();

    const signedProducts = await signProductList(products);

    res.json({
        products: signedProducts,
        page,
        pages: Math.ceil(count / pageSize),
        total: count
    });
});

// @desc    Get single product detail
// @route   GET /api/mobile/product/:id
// @access  Public
const getMobileProductById = asyncHandler(async (req, res) => {
    // Return full details including description
    const product = await Product.findById(req.params.id).lean();

    if (product) {
        const signedProduct = await signProduct(product);
        res.json(signedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

export {
    getMobileHomeData,
    getCategoriesTree,
    getMobileProducts,
    getMobileProductById
};
