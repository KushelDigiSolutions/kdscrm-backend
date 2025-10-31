import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    senderType: { type: String, enum: ['Client', 'Member'], required: true },
    message: { type: String, required: true },
    attachments: [{ type: String }], // optional: URLs or file paths
    timestamp: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['IT', 'HR', 'Finance', 'General'], default: 'General' },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed','Reopen'], default: 'Open' },
    assignedTo: { type: String, default: null },
    feedback: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String }
    },
    organizationId: { type: String, required: true },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clients"
    },
    Project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Projects"
    },
    files: [{ type: String }], // optional: URLs or file paths

    // 💬 Conversation between Client & Admin
    messageThread: [messageSchema]
}, { timestamps: true });

export default mongoose.model('Ticket', ticketSchema);