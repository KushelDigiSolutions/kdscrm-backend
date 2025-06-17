import mongoose from "mongoose";
const mySchema = new mongoose.Schema({
    Branch:{
        type:String
    },
    GoalType:{
        type:String
    },
    startDate:{
     type:String
    },
    endDate:{
        type:String
    },
    subject:{
      type:String
    },
    target: {
        type: String,
    },
    description:{
       type:String
    },
    status: {
        type: String,
        // default: 'true'
    },
    rating:{
        type:Number
    },
    progress:{
        type:Number
    }
});

const Tracking = mongoose.model('Tracking', mySchema);

export default Tracking;
