import User from '../models/User.js';

class UserRepository {
    async findByEmail(email) {
        return await User.findOne({ email });
    }

    async findOne(query) {
        return await User.findOne(query);
    }

    async create(userData) {
        return await User.create(userData);
    }

    async findById(id) {
        return await User.findById(id);
    }

    async findAll() {
        return await User.find({});
    }

    async update(id, updateData) {
        // Using findByIdAndUpdate for atomic update if preferred or manually find/save to trigger hooks
        // To trigger pre-save hooks (like hashing password), manual find/save is better,
        // but for simple fields like name/role, simple update is fine.
        // Assuming updateData is prepared carefully.
        // Let's stick to simple updates for now or logic in service.
        // Actually, for password hashing, we rely on the object.save().
        // So repository might just return the user object to service, and service saves it.
        // BUT for a generic update call:
        return await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }

    async delete(id) {
        return await User.deleteOne({ _id: id });
    }

    // Helper for manual save (triggers hooks)
    async save(user) {
        return await user.save();
    }
}

export default new UserRepository();
