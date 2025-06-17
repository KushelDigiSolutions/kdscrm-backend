import mongoose from 'mongoose';

const mySchema = new mongoose.Schema({
    branch: {
        type: Object,
        default: {}
    },
    name: {
        type: String
    },
    ts: {
        type: String,
        default: new Date().getTime()
    },
    status: {
        type: String,
        default: 'true'
    },
    organizationId: String
});

const Department = mongoose.model('Department', mySchema);

export default Department;
