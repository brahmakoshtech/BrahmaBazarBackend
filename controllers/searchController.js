import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import { signUrls } from "../utils/s3Signer.js";

// @desc    Search products for admin remedies page
// @route   GET /api/products/search
// @access  Private/Admin
const searchProducts = asyncHandler(async (req, res) => {
    const { search } = req.query;

    if (!search) {
        return res.json({ products: [], category: null, subcategory: null });
    }

    const keyword = new RegExp(search, 'i');

    // Search in Title, Category, Subcategory
    const products = await Product.find({
        $or: [
            { title: keyword },
            { category: keyword },
            { subcategory: keyword }
        ]
    }).limit(20); // Limit results for performance

    // Sign URLs
    const signedProducts = await Promise.all(products.map(async (p) => {
        const product = p.toObject ? p.toObject() : { ...p };
        if (product.images && product.images.length > 0) {
            product.images = await signUrls(product.images);
        }
        return product;
    }));

    // Logic to determine "Suggested" Category/Subcategory
    // If we have results, and they predominantly belong to one category, send it.
    let suggestedCategory = null;
    let suggestedSubcategory = null;

    if (signedProducts.length > 0) {
        // Check if exact match on Category Name
        const categoryMatch = signedProducts.find(p => p.category.toLowerCase() === search.toLowerCase());
        if (categoryMatch) {
            suggestedCategory = categoryMatch.category;
        } else {
            // Or if all found products share the same category
            const firstCat = signedProducts[0].category;
            const sameCat = signedProducts.every(p => p.category === firstCat);
            if (sameCat) suggestedCategory = firstCat;
        }

        // Check matching subcategory
        const subMatch = signedProducts.find(p => p.subcategory && p.subcategory.toLowerCase() === search.toLowerCase());
        if (subMatch) {
            suggestedSubcategory = subMatch.subcategory;
            suggestedCategory = subMatch.category; // Parent category of subcategory
        } else if (suggestedCategory) {
            // If we have a category, check if all products share a subcategory
            const firstSub = signedProducts[0].subcategory;
            if (firstSub && signedProducts.every(p => p.subcategory === firstSub)) {
                suggestedSubcategory = firstSub;
            }
        }
    }

    res.json({
        products: signedProducts,
        category: suggestedCategory,
        subcategory: suggestedSubcategory
    });
});

export { searchProducts };
