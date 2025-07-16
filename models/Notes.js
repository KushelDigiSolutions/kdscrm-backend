import mongoose from 'mongoose';

const meetSchema = new mongoose.Schema({
    Note: {
        type: String,
        required: true,
    },
    dateAdded: {
        type: Date,
        default: Date.now,
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Projects',
        required: true,
    }
});

const Notes = mongoose.model('Meet', meetSchema);
export default Notes;
