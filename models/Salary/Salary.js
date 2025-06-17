import mongoose from 'mongoose';
const mySchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: "user"
    },
    employee:{
       type:String
    },
    paySlipType:{
        type:String,
        default:"Monthly Payslip"
    },
    salary:{
        type:String
    }
});

const Salary = mongoose.model('Salary', mySchema);

export default Salary;
