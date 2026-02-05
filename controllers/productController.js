import asyncHandler from "express-async-handler";
import ProductServiceImpl from "../services/impl/ProductServiceImpl.js";
import { signUrls, extractKeyFromUrl } from "../utils/s3Signer.js";
// Force deployment update

// Helper to sign product images
const signProductData = async (product) => {
    if (!product) return null;
    const signedProduct = product.toObject ? product.toObject() : { ...product };

    if (signedProduct.images && signedProduct.images.length > 0) {
        signedProduct.images = await signUrls(signedProduct.images);
    }
    return signedProduct;
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    // console.log("✅ GET /api/products API HIT");

    const keyword = req.query.keyword || "";
    const category = req.query.category || "";
    const subcategory = req.query.subcategory || "";

    const products = await ProductServiceImpl.getProducts(
        keyword,
        category,
        subcategory
    );

    // Sign URLs for all products
    const signedProducts = await Promise.all(products.map(signProductData));

    // console.log("✅ Products fetched successfully:", signedProducts?.length);

    res.json(signedProducts);
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

    const signedProduct = await signProductData(product);
    res.json(signedProduct);
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
    let productData = { ...req.body };

    // Handle uploaded images - SAVE KEY ONLY
    // Handle uploaded images - SAVE KEY ONLY
    if (req.files && req.files.length > 0) {
        productData.images = req.files.map((file) => file.key);
    } else if (productData.images) {
        // If images are passed in body (e.g. existing URLs), extract keys
        if (typeof productData.images === 'string') {
            productData.images = [productData.images];
        }
        if (Array.isArray(productData.images)) {
            productData.images = productData.images.map(extractKeyFromUrl);
        }
    }

    const product = await ProductServiceImpl.createProduct(productData);
    const signedProduct = await signProductData(product);

    res.status(201).json(signedProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
    let productData = { ...req.body };

    if (req.files && req.files.length > 0) {
        productData.images = req.files.map((file) => file.key);
    } else if (productData.images) {
        // If images are passed in body (e.g. existing URLs), extract keys
        if (typeof productData.images === 'string') {
            productData.images = [productData.images];
        }
        if (Array.isArray(productData.images)) {
            productData.images = productData.images.map(extractKeyFromUrl);
        }
    }

    const product = await ProductServiceImpl.updateProduct(
        req.params.id,
        productData
    );

    const signedProduct = await signProductData(product);
    res.json(signedProduct);
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
    toggleTrending,
    toggleNewArrival,
    getTrendingProducts,
    getNewArrivalProducts,
};

// @desc    Toggle product trending status
// @route   PUT /api/products/:id/trending
// @access  Private/Admin
const toggleTrending = asyncHandler(async (req, res) => {
    const product = await ProductServiceImpl.toggleTrending(req.params.id);
    const signedProduct = await signProductData(product);
    res.json(signedProduct);
});

// @desc    Toggle product new arrival status
// @route   PUT /api/products/:id/newarrival
// @access  Private/Admin
const toggleNewArrival = asyncHandler(async (req, res) => {
    const product = await ProductServiceImpl.toggleNewArrival(req.params.id);
    const signedProduct = await signProductData(product);
    res.json(signedProduct);
});

// @desc    Get all trending products
// @route   GET /api/products/trending
// @access  Public
const getTrendingProducts = asyncHandler(async (req, res) => {
    const products = await ProductServiceImpl.getTrendingProducts();
    const signedProducts = await Promise.all(products.map(signProductData));
    res.json(signedProducts);
});

// @desc    Get all new arrival products
// @route   GET /api/products/new-arrival
// @access  Public
const getNewArrivalProducts = asyncHandler(async (req, res) => {
    const products = await ProductServiceImpl.getNewArrivalProducts();
    const signedProducts = await Promise.all(products.map(signProductData));
    res.json(signedProducts);
});
