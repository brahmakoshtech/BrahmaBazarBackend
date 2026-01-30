import AuthServiceImpl from '../services/impl/AuthServiceImpl.js';

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await AuthServiceImpl.registerUser({ name, email, password });
        res.status(201).json(user);
    } catch (error) {
        res.status(400); // 400 Bad Request
        throw new Error(error.message);
    }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await AuthServiceImpl.authUser({ email, password });
        res.json(user);
    } catch (error) {
        res.status(401); // 401 Unauthorized
        throw new Error(error.message);
    }
};

// @desc    Forgot Password
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await AuthServiceImpl.forgotPassword(email);
        res.json(result);
    } catch (error) {
        res.status(404);
        throw new Error(error.message);
    }
};

// @desc    Reset Password
// @route   PUT /api/users/reset-password/:resetToken
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const result = await AuthServiceImpl.resetPassword(req.params.resetToken, password);
        res.json(result);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
};

export { registerUser, authUser, forgotPassword, resetPassword };
