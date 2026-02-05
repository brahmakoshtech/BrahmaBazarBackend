import AdminStatsServiceImpl from '../services/impl/AdminStatsServiceImpl.js';
import { generateSignedUrl } from '../utils/s3Signer.js';

// @desc    Get dashboard summary stats
// @route   GET /api/admin/summary
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const stats = await AdminStatsServiceImpl.getDashboardStats();

        // Sign images in recent orders
        if (stats.recentOrders) {
            stats.recentOrders = await Promise.all(stats.recentOrders.map(async (order) => {
                const o = order.toObject ? order.toObject() : { ...order };
                if (o.products) {
                    o.products = await Promise.all(o.products.map(async (p) => {
                        if (p.image) p.image = await generateSignedUrl(p.image);
                        return p;
                    }));
                }
                return o;
            }));
        }

        // Sign images in top selling products
        if (stats.topSellingProducts) {
            stats.topSellingProducts = await Promise.all(stats.topSellingProducts.map(async (p) => {
                const prod = p.toObject ? p.toObject() : { ...p };
                if (prod.images && prod.images.length > 0) {
                    prod.images = await Promise.all(prod.images.map(img => generateSignedUrl(img)));
                } else if (prod.image) {
                    prod.image = await generateSignedUrl(prod.image);
                }
                return prod;
            }));
        }

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getDashboardStats };
