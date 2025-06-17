import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema({
    dealName: String,
    amount: Number,
    closingDate: Date,
    stage: String,
    campaignSource: String,
    contactRole: String,
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead'
    },
    organizationId: String,
    createdBy: String
}, { timestamps: true });

const Deal = mongoose.model('Deal', dealSchema);
export default Deal;
