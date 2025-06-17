import mongoose from 'mongoose';
const mySchema = new mongoose.Schema({
    warningBy: {
        type: String,
    },
    warningTo: {
        type: String
    },
    warningById: {
        type: String,
    },
    warningToId: {
        type: String
    },
    subject: {
        type: String
    },
    warningDate: {
        type: String
    },
    description: {
        type: String
    },
    organizationId: String
});

const Warning = mongoose.model('Warning', mySchema);

export default Warning;
