import mongoose from 'mongoose';
const mySchema = new mongoose.Schema({
    Employee: {
        type: String,
    },
    type: {
        type: String
    },
    userId: {
        type: String
    },
    noticeDate: {
        type: String
    },
    terminationDate: {
        type: String,
    },
    description: {
        type: String
    },
    organizationId: String
});

const Termination = mongoose.model('Termination', mySchema);

export default Termination;
