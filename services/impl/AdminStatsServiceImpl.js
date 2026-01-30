import UserRepository from '../../repositories/UserRepository.js';
import ProductRepository from '../../repositories/ProductRepository.js';
import OrderRepository from '../../repositories/OrderRepository.js';
import Order from '../../models/Order.js'; // Fallback for specific aggregation if repo doesn't cover it
import User from '../../models/User.js';
import Product from '../../models/Product.js';

class AdminStatsServiceImpl {
    async getDashboardStats() {
        // We can add simple count methods to repositories if not present, 
        // or use the models directly INSIDE the service if it's specific aggregation logic not worth abstracting yet.
        // For cleaner architecture, let's keep model access inside Repos or Services, never Controllers.
        // Since we didn't add count methods to Repos yet, I will use Models here strictly.
        // Ideally, we extended Repos, but for this refactor, placing logic here is the Service Layer's job.

        const [
            usersCount,
            productsCount,
            ordersCount,
            paidOrders
        ] = await Promise.all([
            User.countDocuments(),
            Product.countDocuments(),
            Order.countDocuments(),
            Order.find({ paymentStatus: 'Paid' }).select('totalAmount')
        ]);

        const totalSales = paidOrders.reduce((acc, order) => acc + order.totalAmount, 0);

        const recentOrders = await Order.find()
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        return {
            usersCount,
            productsCount,
            ordersCount,
            totalSales,
            recentOrders
        };
    }
}

export default new AdminStatsServiceImpl();
