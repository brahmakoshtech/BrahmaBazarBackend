import mongoose from 'mongoose';

const userAddressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    pincode: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    addressLine1: {
        type: String,
        required: true,
    },
    addressLine2: {
        type: String,
    },
    landmark: {
        type: String,
    },
    country: {
        type: String,
        default: 'India',
        required: true,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true, // This handles createdAt/updatedAt automatically
});

const UserAddress = mongoose.model('UserAddress', userAddressSchema);

export default UserAddress;
