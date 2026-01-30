import ProductRepository from '../../repositories/ProductRepository.js';

class ProductServiceImpl {

    static async getProducts(keyword, category, subcategory) {
        return await ProductRepository.findWithQuery(keyword, category, subcategory);
    }

    static async getProductById(id) {
        const product = await ProductRepository.findById(id);
        if (!product) throw new Error("Product not found");
        return product;
    }

    static async createProduct(productData) {
        return await ProductRepository.create(productData);
    }

    static async updateProduct(id, productData) {
        const updated = await ProductRepository.update(id, productData);
        if (!updated) throw new Error("Product not found");
        return updated;
    }

    static async deleteProduct(id) {
        const success = await ProductRepository.delete(id);
        if (!success) throw new Error("Product not found");
        return { message: "Product removed" };
    }
}

export default ProductServiceImpl;

