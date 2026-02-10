import mongoose from 'mongoose';

const remedyBannerSchema = new mongoose.Schema({
    image: {
        type: String, // S3 Key
        required: true
    },
    type: {
        type: String,
        required: true,
        default: 'shop'
    },
    title: {
        type: String
    },
    description: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const RemedyBanner = mongoose.model('RemedyBanner', remedyBannerSchema);
export default RemedyBanner;
