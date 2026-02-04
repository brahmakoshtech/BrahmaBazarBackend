import UserRepository from '../../repositories/UserRepository.js';
import UserDTO from '../../dtos/UserDTO.js';
import generateToken from '../../utils/generateToken.js';
import { signUrls } from '../../utils/s3Signer.js';

class UserServiceImpl {
    async getAllUsers() {
        const users = await UserRepository.findAll();
        // Return DTOs to avoid leaking passwords if ever populate accidentally does it
        return users.map(user => new UserDTO(user));
    }

    async getUserById(id) {
        const user = await UserRepository.findById(id);
        if (!user) throw new Error('User not found');
        // If used for admin view, maybe we don't mask everything, but DTO is safer
        return new UserDTO(user);
    }

    async deleteUser(id) {
        const user = await UserRepository.findById(id);
        if (!user) throw new Error('User not found');
        return await UserRepository.delete(id);
    }

    async updateUser(id, updateData) {
        const user = await UserRepository.findById(id);
        if (!user) throw new Error('User not found');

        user.name = updateData.name || user.name;
        user.email = updateData.email || user.email;
        if (updateData.role) user.role = updateData.role;
        if (typeof updateData.isActive !== 'undefined') user.isActive = updateData.isActive;

        const updatedUser = await UserRepository.save(user);
        return new UserDTO(updatedUser);
    }

    async getUserProfile(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) throw new Error('User not found');
        return new UserDTO(user);
    }

    async updateUserProfile(userId, updateData) {
        const user = await UserRepository.findById(userId);
        if (!user) throw new Error('User not found');

        user.name = updateData.name || user.name;
        user.email = updateData.email || user.email;

        if (updateData.password) {
            user.password = updateData.password; // Triggers pre-save hook
        }

        const updatedUser = await UserRepository.save(user);
        const dto = new UserDTO(updatedUser);
        dto.token = generateToken(updatedUser._id);
        return dto;
    }

    // Wishlist Logic
    async addToWishlist(userId, productId) {
        const user = await UserRepository.findById(userId);
        if (!user) throw new Error('User not found');

        if (user.wishlist.includes(productId)) {
            throw new Error('Product already in wishlist');
        }

        user.wishlist.push(productId);
        await UserRepository.save(user);
        return user.wishlist;
    }

    async getWishlist(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) throw new Error('User not found');

        // We need to populate this. 
        await user.populate('wishlist');

        // Sign images for wishlist items
        const wishlistItems = user.wishlist;
        if (wishlistItems && wishlistItems.length > 0) {
            await Promise.all(wishlistItems.map(async (item) => {
                if (item.images && item.images.length > 0) {
                    item.images = await signUrls(item.images);
                }
            }));
        }

        return user.wishlist;
    }

    async removeFromWishlist(userId, productId) {
        const user = await UserRepository.findById(userId);
        if (!user) throw new Error('User not found');

        user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
        await UserRepository.save(user);
        return user.wishlist;
    }

    async initDeveloper(userId, secretKey) {
        if (secretKey !== process.env.DEV_SECRET) {
            throw new Error('Invalid Developer Secret Key');
        }

        const user = await UserRepository.findById(userId);
        if (!user) throw new Error('User not found');

        user.role = 'developer';
        const updatedUser = await UserRepository.save(user);

        const dto = new UserDTO(updatedUser);
        dto.token = generateToken(updatedUser._id); // Refresh token with new role
        return dto;
    }
}

export default new UserServiceImpl();
