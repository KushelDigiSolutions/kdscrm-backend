import mongoose from 'mongoose';

const mySchema = new mongoose.Schema({
    type: {
        type: String,
    },
    users:[{
        type: mongoose.Types.ObjectId , 
    }],
   
});

const EmployeeType = mongoose.model('EmployeeType', mySchema);

export default EmployeeType;
