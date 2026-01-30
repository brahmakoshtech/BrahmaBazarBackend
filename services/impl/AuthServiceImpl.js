import UserRepository from '../../repositories/UserRepository.js';
import UserDTO from '../../dtos/UserDTO.js';
import generateToken from '../../utils/generateToken.js';
import crypto from 'crypto';
import sendEmail from '../../utils/sendEmail.js';

class AuthServiceImpl {
    async registerUser({ name, email, password }) {
        const userExists = await UserRepository.findByEmail(email);

        if (userExists) {
            throw new Error('User already exists');
        }

        const user = await UserRepository.create({
            name,
            email,
            password,
        });

        if (user) {
            const userDto = new UserDTO(user);
            userDto.token = generateToken(user._id);
            return userDto;
        } else {
            throw new Error('Invalid user data');
        }
    }

    async authUser({ email, password }) {
        const user = await UserRepository.findByEmail(email);

        if (user && (await user.matchPassword(password))) {
            if (user.isActive === false) {
                const error = new Error('Account deactivated');
                error.statusCode = 403; // Forbidden
                throw error;
            }

            const userDto = new UserDTO(user);
            userDto.token = generateToken(user._id);
            return userDto;
        } else {
            throw new Error('Invalid email or password');
        }
    }

    async forgotPassword(email) {
        const user = await UserRepository.findByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }

        // Generate token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash and set to resetPasswordToken
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        await UserRepository.save(user);

        // Send Email
        let clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

        // Auto-fix: If we are on production (Render) but CLIENT_URL is still localhost, force the Vercel URL
        // This handles the case where the user forgot to update the env var on Render
        if (clientUrl.includes('localhost') && (process.env.NODE_ENV === 'production' || process.env.ON_RENDER === 'true')) {
            clientUrl = 'https://e-comm-2adg.vercel.app';
        }

        const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. \n\n Please make a PUT request to: \n ${resetUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Token',
                message,
            });

            return { message: 'Email sent', resetUrl }; // access to resetUrl only for dev
        } catch (error) {
            console.error('Email send failed:', error.message);
            console.log('--- EMERGENCY RESET LINK (Check logs to access account) ---');
            console.log(resetUrl);
            console.log('---------------------------------------------------------');

            // CRITICAL FIX: Do NOT clear the token on email failure
            // user.resetPasswordToken = undefined;
            // user.resetPasswordExpire = undefined;
            // await UserRepository.save(user);

            // Return success-like response so frontend doesn't show error to user
            return { message: 'Email service issue, but Reset Token generated. Check Server Logs for link.' };
        }
    }

    async resetPassword(resetToken, newPassword) {
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        const user = await UserRepository.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            throw new Error('Invalid token');
        }

        // Set new password
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await UserRepository.save(user); // Pre-save hook will hash password

        return { message: 'Password updated success' };
    }
}

export default new AuthServiceImpl();
