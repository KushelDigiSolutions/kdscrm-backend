import mongoose from 'mongoose';

const mySchema = new mongoose.Schema({
    name:String
});

const LeadStat = mongoose.model('LeadStat', mySchema);

export default LeadStat;
