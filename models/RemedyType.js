import mongoose from 'mongoose';

const remedyTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    }
}, {
    timestamps: true
});

const RemedyType = mongoose.model('RemedyType', remedyTypeSchema);
export default RemedyType;
