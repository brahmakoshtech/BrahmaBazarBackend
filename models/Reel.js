import mongoose from 'mongoose';

const reelSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
    },
    videoUrl: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true,
});

const Reel = mongoose.model('Reel', reelSchema);

export default Reel;
