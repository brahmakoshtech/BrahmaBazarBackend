import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: false, // Not required for Google Users
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true, // Allows null/undefined to not conflict
    },
    avatar: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'developer'],
        default: 'user',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    cart: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
            quantity: {
                type: Number,
                default: 1,
            },
        },
    ],
    wishlist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        }
    ],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
}, {
    timestamps: true,
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false; // If user has no password (e.g. Google Login only)
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
    // If password is not modified or doesn't exist, skip hashing
    if (!this.isModified('password') || !this.password) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        throw error;
    }
});

const User = mongoose.model('User', userSchema);

export default User;
