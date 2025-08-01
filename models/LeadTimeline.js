// models/LeadTimeline.js
import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
    note: { type: String, required: true }
}, { timestamps: true });

const leadTimelineSchema = new mongoose.Schema({
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    notes: {
        type: [noteSchema],
        default: []
    },
    createdBy: {
        type: String,
        default: 'System'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const LeadTimeline = mongoose.model("LeadTimeline", leadTimelineSchema);
export default LeadTimeline;
