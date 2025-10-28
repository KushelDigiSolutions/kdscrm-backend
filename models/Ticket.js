import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['IT', 'HR', 'Finance', 'General'], default: 'General' },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
    assignedTo: { type: String, default: null },
    feedback: { type: String },
    organizationId: { type: String, required: true },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clients"
    },
    Project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Projects"
    },
}, { timestamps: true });

export default mongoose.model('Ticket', ticketSchema);