import asyncHandler from "express-async-handler";
import ProductServiceImpl from "../services/impl/ProductServiceImpl.js";
import { signUrls } from "../utils/s3Signer.js";

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
    if (req.files && req.files.length > 0) {
        productData.images = req.files.map((file) => file.key);
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
        productData.images = req.files.map((file) => file.key);
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
