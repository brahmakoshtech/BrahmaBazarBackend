import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    description: {
        type: String,
    },
    image: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    subcategories: [{
        name: { type: String, required: true },
        slug: { type: String, required: true },
        image: String,
        isActive: { type: Boolean, default: true }
    }]
}, {
    timestamps: true,
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
