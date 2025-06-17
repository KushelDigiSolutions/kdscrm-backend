import mongoose from 'mongoose';

const mySchema = new mongoose.Schema({
    startDate: {
        type: String,
    },
    endDate: {
        type: String,
    },
    user: {
        type: String,
    },
});

const EmployeeLeave = mongoose.model('EmployeeLeave', mySchema);

export default EmployeeLeave;
