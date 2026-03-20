import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
    try {
        // 1) Prefer SSO cookie token (set by our SSO route as auth_token/token)
        const cookieToken =
            req.cookies?.auth_token ||
            req.cookies?.token ||
            req.cookies?.authToken ||
            null;

        // 2) Fallback to Authorization header
        let token =
            cookieToken ||
            (req.headers.authorization?.startsWith('Bearer')
                ? req.headers.authorization.split(' ')[1]
                : null);

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId || decoded.id || decoded.userID;

        if (!userId) {
            return res.status(401).json({ message: 'Not authorized, invalid token payload' });
        }

        req.user = await User.findById(userId).select('-password');
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        return next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const admin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'developer')) {
        next();
    } else {
        res.status(401);
        throw new Error('Not authorized as an admin');
    }
};

export { protect, admin };
