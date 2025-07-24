import mongoose from 'mongoose';

const mySchema = new mongoose.Schema({
    name: String,
    organizationId: String
});

const LeadSource = mongoose.model('LeadSource', mySchema);

export default LeadSource;
