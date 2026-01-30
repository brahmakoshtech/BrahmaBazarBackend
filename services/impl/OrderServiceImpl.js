import OrderRepository from '../../repositories/OrderRepository.js';

class OrderServiceImpl {
    async getOrderById(id, user) {
        const order = await OrderRepository.findById(id);

        if (!order) {
            throw new Error('Order not found');
        }

        // Logic to check permissions (Admin or Owner)
        // Note: Ideally permission checks might be in Controller or a separate policy service, 
        // but putting business rule validation "can view" here is also O.K. provided we pass the user.
        if (user.role === 'admin' || user.role === 'developer' || order.user._id.equals(user._id)) {
            return order;
        } else {
            throw new Error('Not authorized to view this order');
        }
    }

    async getMyOrders(userId) {
        return await OrderRepository.findByUser(userId);
    }

    // Admin Methods
    async getAllOrders(filters = {}) {
        let query = {};
        if (filters.orderStatus) query.orderStatus = filters.orderStatus;
        if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
        if (filters.from || filters.to) {
            query.createdAt = {};
            if (filters.from) query.createdAt.$gte = new Date(filters.from);
            if (filters.to) query.createdAt.$lte = new Date(filters.to);
        }
        return await OrderRepository.findAll(query);
    }

    async adminGetOrderById(id) {
        const order = await OrderRepository.findById(id);
        if (!order) throw new Error('Order not found');
        await order.populate('products.productId', 'title price image'); // Ensure full population
        return order;
    }

    async updateOrderStatus(id, status) {
        const order = await OrderRepository.findById(id);
        if (!order) throw new Error('Order not found');

        order.orderStatus = status;
        if (status === 'Delivered') {
            order.deliveredAt = Date.now();
        }
        return await OrderRepository.update(id, order); // Saving the modified doc via update (or just save directly)
    }

    async updatePaymentStatus(id, status) {
        const order = await OrderRepository.findById(id);
        if (!order) throw new Error('Order not found');

        order.paymentStatus = status;
        if (status === 'Paid') {
            order.paidAt = Date.now();
        }
        return await OrderRepository.update(id, order);
    }

    async deleteOrder(id) {
        const order = await OrderRepository.findById(id);
        if (!order) throw new Error('Order not found');

        if (order.paymentStatus === 'Paid') {
            order.orderStatus = 'Cancelled'; // Cancel instead of delete if paid
            await OrderRepository.update(id, order);
            return { message: 'Order cancelled because it was already paid' };
        } else {
            await OrderRepository.delete(id);
            return { message: 'Order removed' };
        }
    }

    async getOrdersByUserId(userId) {
        return await OrderRepository.findByUser(userId);
    }
}

export default new OrderServiceImpl();
