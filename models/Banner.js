import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    link: {
        type: String, // Where clicking the banner takes the user
    },
    position: {
        type: String,
        enum: ['home-hero', 'home-secondary', 'category-top', 'sidebar'],
        default: 'home-hero',
    },
    displayOrder: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true,
});

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;
