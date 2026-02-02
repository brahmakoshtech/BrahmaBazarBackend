import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const passportConfig = () => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // 1. Check if user exists by googleId
                    let user = await User.findOne({ googleId: profile.id });

                    if (user) {
                        return done(null, user);
                    }

                    // 2. Check if user exists by email
                    user = await User.findOne({ email: profile.emails[0].value });

                    if (user) {
                        // Link Google ID to existing user
                        user.googleId = profile.id;
                        if (!user.avatar) user.avatar = profile.photos[0].value;
                        await user.save();
                        return done(null, user);
                    }

                    // 3. Create new user
                    user = await User.create({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        avatar: profile.photos[0].value,
                        password: '', // No password for Google users
                    });

                    return done(null, user);
                } catch (error) {
                    return done(error, null);
                }
            }
        )
    );

    // Serialization is not strictly needed if we are just generating JWTs immediately, 
    // but useful if we use sessions. We will use JWTs, but passport requires this initialization sometimes.
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};

export default passportConfig;
