import mongoose from 'mongoose';
const mySchema = new mongoose.Schema({
    Branch: {
        type: String
    },
    userId: {
        type: String
    },
    SelectMonth: {
        type: String
    },
    Employee: {
        type: String,
    },
    remarks: {
        type: String,
    },
    ts: {
        type: String,
    },
    organizationId: String
});

const Apprisal = mongoose.model('Apprisal', mySchema);

export default Apprisal;
