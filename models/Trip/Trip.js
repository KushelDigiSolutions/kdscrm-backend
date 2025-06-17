import mongoose from 'mongoose';
const mySchema = new mongoose.Schema({
    Employee: {
        type: String,
    },
    startDate:{
        type:String
    },
    endDate:{
        type:String
    },
    purpose:{
        type:String
    },
    country:{
        type:String
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: "user"
    },
    description:{
        type:String
    }
});

const Trip = mongoose.model('Trip', mySchema);

export default Trip;
