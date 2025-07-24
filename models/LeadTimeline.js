// models/LeadTimeline.js
import mongoose from "mongoose";

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
        type: [String],
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
