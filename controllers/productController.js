import asyncHandler from "express-async-handler";
import ProductServiceImpl from "../services/impl/ProductServiceImpl.js";

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    console.log("✅ GET /api/products API HIT");

    const keyword = req.query.keyword || "";
    const category = req.query.category || "";
    const subcategory = req.query.subcategory || "";

    console.log("🔍 Filters:", { keyword, category, subcategory });

    const products = await ProductServiceImpl.getProducts(
        keyword,
        category,
        subcategory
    );

    console.log("✅ Products fetched successfully:", products?.length);

    res.json(products);
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const product = await ProductServiceImpl.getProductById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    res.json(product);
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
    let productData = { ...req.body };

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
        productData.images = req.files.map((file) => file.path);
    }

    const product = await ProductServiceImpl.createProduct(productData);

    res.status(201).json(product);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
    let productData = { ...req.body };

    if (req.files && req.files.length > 0) {
        productData.images = req.files.map((file) => file.path);
    }

    const product = await ProductServiceImpl.updateProduct(
        req.params.id,
        productData
    );

    res.json(product);
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
    const result = await ProductServiceImpl.deleteProduct(req.params.id);
    res.json(result);
});

export {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};
