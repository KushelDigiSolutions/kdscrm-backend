import mongoose from 'mongoose';

const mySchema = new mongoose.Schema({
    name: String,
    organizationId: String
});

const FollowUpType = mongoose.model('FollowUpType', mySchema);

export default FollowUpType;
