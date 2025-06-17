import mongoose from 'mongoose';

const mySchema = new mongoose.Schema({
    name:String
});

const LeadStatus = mongoose.model('LeadStatus', mySchema);

export default LeadStatus;
