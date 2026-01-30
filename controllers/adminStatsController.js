import AdminStatsServiceImpl from '../services/impl/AdminStatsServiceImpl.js';

// @desc    Get dashboard summary stats
// @route   GET /api/admin/summary
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const stats = await AdminStatsServiceImpl.getDashboardStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getDashboardStats };
