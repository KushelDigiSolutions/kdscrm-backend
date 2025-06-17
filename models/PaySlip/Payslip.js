import mongoose from 'mongoose';
const { Schema } = mongoose;

const paySlipSchema = new Schema({
    user: {
        type: String, // Because SQL user.id is probably an integer
        required: true
    },
    month: {
        type: String
    },
    year: {
        type: String,
    },
    status: {
        type: String,
        default: "Unpaid"
    },
});

const Payslip = mongoose.model('Payslip', paySlipSchema);
export default Payslip;
