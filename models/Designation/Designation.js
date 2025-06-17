import mongoose from 'mongoose';

const mySchema = new mongoose.Schema({
    department: {
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
    }
});

const Designation = mongoose.model('Designation', mySchema);

export default Designation;
