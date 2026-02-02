import express from 'express';
import passport from 'passport';
import generateToken from '../utils/generateToken.js';

const router = express.Router();

// @desc    Auth with Google
// @route   GET /auth/google
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    (req, res) => {
        // Successful authentication
        const token = generateToken(req.user._id);

        // Redirect to frontend with token
        // We use a query parameter to pass the token. 
        // In a more secure setup, we might use an HTTP-only cookie or a temporary code.
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        // Ensure we are redirecting to the correct frontend route that handles the token login
        // For example: /auth/success?token=...
        res.redirect(`${frontendUrl}/auth/success?token=${token}`);
    }
);

export default router;
