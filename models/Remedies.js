import mongoose from 'mongoose';

const remediesSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['shop', 'yatra', 'seva'],
        default: 'shop',
        required: true
    },
    section: {
        type: String,
        enum: ['must_have', 'good_to_have'],
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    }
}, {
    timestamps: true
});

const Remedies = mongoose.model('Remedies', remediesSchema);
export default Remedies;
