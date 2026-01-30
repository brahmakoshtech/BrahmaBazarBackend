import mongoose from 'mongoose';

const contentBlockSchema = mongoose.Schema({
    identifier: {
        type: String,
        required: true,
        unique: true, // e.g., 'navbar_announcement'
        index: true
    },
    section: {
        type: String,
        required: true, // e.g., 'navbar', 'home_hero', 'footer'
        index: true
    },
    title: {
        type: String,
        required: true // Human readable label, e.g., "Announcement Bar Text"
    },
    content: {
        type: String,
        required: true // The actual text/html content
    },
    type: {
        type: String,
        enum: ['text', 'image', 'html', 'link'],
        default: 'text'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const ContentBlock = mongoose.model('ContentBlock', contentBlockSchema);

export default ContentBlock;
