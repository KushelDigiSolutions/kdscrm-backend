import mongoose from 'mongoose';

const mySchema = new mongoose.Schema({
    name:String
});

const LeadSource = mongoose.model('LeadSource', mySchema);

export default LeadSource;
