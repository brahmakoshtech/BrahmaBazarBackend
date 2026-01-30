import Product from '../models/Product.js';

class ProductRepository {
    async findAll(query = {}, page = 1, limit = 10) {
        // Basic pagination logic if needed, can be expanded
        const skip = (page - 1) * limit;
        // If limit is 0 or very high, we might want to return all. 
        // For now, implementing basic find.
        // Checking if query has keyword for search
        let filter = {};
        if (query.keyword) {
            filter = {
                title: {
                    $regex: query.keyword,
                    $options: 'i',
                },
            };
        }

        // This is a simplified version. The original controller had more complex pagination.
        // We will adapt the service to use this.
        return await Product.find(filter); // Returning all for now to match current behavior effectively or simple filter
    }

    // Improved findAll to match original controller's capabilities
    async findWithQuery(keyword, category, subcategory) {
        const query = {};

        if (keyword) {
            query.title = {
                $regex: keyword,
                $options: 'i',
            };
        }

        if (category) {
            query.category = category;
        }

        if (subcategory) {
            query.subcategory = subcategory;
        }

        return await Product.find(query); // Removed limit(10) to show all products for now, or keep pagination if needed later. But user might want to see all.
    }

    async findById(id) {
        return await Product.findById(id);
    }

    async create(productData) {
        const product = new Product(productData);
        return await product.save();
    }

    async update(id, productData) {
        const product = await Product.findById(id);
        if (product) {
            Object.assign(product, productData);
            return await product.save();
        }
        return null;
    }

    async delete(id) {
        const product = await Product.findById(id);
        if (product) {
            await product.deleteOne(); // or remove() depending on Mongoose version
            return true;
        }
        return false;
    }
}

export default new ProductRepository();
