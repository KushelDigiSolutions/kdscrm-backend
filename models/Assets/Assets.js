import mongoose from 'mongoose';
const mySchema = new mongoose.Schema({
    Employee: {
        type: String,
    },
    designation: {
        type: String
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: "user"
    },
    department:{
        type:String
    },
    product:{
        type:String
    },
    purchaseDate: {
        type: String,
    },
    additonal:{
        type:String
    },
    description:{
        type:String
    } , 
    status:{
        type:String , 
        default:"Pending"
    }
});

const Assets = mongoose.model('Assets', mySchema);

export default Assets;
