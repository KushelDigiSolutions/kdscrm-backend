import mongoose from 'mongoose';
const mySchema = new mongoose.Schema({
    user: {
        type:String
    },
    LoanOption:{
        type:String
    },
    title:{
        type:String
    },
    type:{
        type:String , 
    },
    loanAmount:{
        type:String
    },
    reason:{
        type:String,
    }
    
});

const Loan = mongoose.model('Loan', mySchema);

export default Loan;
