import Order from '../models/Order.js';

class OrderRepository {
    async findById(id) {
        return await Order.findById(id).populate('user', 'name email');
    }

    async findByUser(userId) {
        return await Order.find({ user: userId })
            .populate('products.productId', 'title price image')
            .sort({ createdAt: -1 });
    }

    async create(orderData) {
        const order = new Order(orderData);
        return await order.save();
    }

    async findAll(query = {}) {
        return await Order.find(query)
            .populate('user', 'name email')
            .populate('products.productId', 'title price image')
            .sort({ createdAt: -1 });
    }

    async update(id, updateData) {
        const order = await Order.findById(id);
        if (order) {
            Object.assign(order, updateData);
            return await order.save();
        }
        return null;
    }

    async delete(id) {
        const order = await Order.findById(id);
        if (order) {
            await order.deleteOne();
            return true;
        }
        return false;
    }
}

export default new OrderRepository();
