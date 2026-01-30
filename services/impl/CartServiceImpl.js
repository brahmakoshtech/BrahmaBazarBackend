import UserRepository from '../../repositories/UserRepository.js';
import ProductRepository from '../../repositories/ProductRepository.js';

class CartServiceImpl {
    async addToCart(userId, productId, quantity) {
        const qty = quantity ? Number(quantity) : 1;
        const user = await UserRepository.findById(userId);
        const product = await ProductRepository.findById(productId);

        if (!product) {
            throw new Error('Product not found');
        }

        const itemIndex = user.cart.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            user.cart[itemIndex].quantity += qty;
        } else {
            user.cart.push({ product: productId, quantity: qty });
        }

        return await UserRepository.save(user); // Returns user with updated cart
    }

    async getCart(userId) {
        const user = await UserRepository.findById(userId);
        // We need to populate. Since Repo returns the Mongoose doc, we can chain populate or use a specific Repo method.
        // For consistency, let's assume we populate here or add findWithCart method in Repo.
        // Using mongoose method on doc for now:
        // Populate title, price, images, AND category
        await user.populate('cart.product', 'title price images category subcategory');

        // Filter out null products (in case product was deleted)
        const validCart = user.cart.filter(item => item.product != null);

        // Optional: Save if we found invalid items to clean up DB
        if (validCart.length !== user.cart.length) {
            user.cart = validCart;
            await user.save();
        }

        return validCart;
    }

    async updateCartItem(userId, productId, quantity) {
        const user = await UserRepository.findById(userId);
        const itemIndex = user.cart.findIndex(item => item.product.toString() === productId);

        if (itemIndex > -1) {
            user.cart[itemIndex].quantity = Number(quantity);
            await UserRepository.save(user);
            return user.cart;
        } else {
            throw new Error('Item not found in cart');
        }
    }

    async removeCartItem(userId, productId) {
        const user = await UserRepository.findById(userId);
        user.cart = user.cart.filter(item => item.product.toString() !== productId);
        await UserRepository.save(user);
        return user.cart;
    }
}

export default new CartServiceImpl();
