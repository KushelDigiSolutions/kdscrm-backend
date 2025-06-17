import mongoose, { mongo } from 'mongoose';

const taskModel = new mongoose.Schema({

    LeadName:{
        type: String,
    },
    FollowUpType: {
        type: String , 
    },
    Date: {
        type: Date,
        default:Date.now()
    },
    Time: {
        type: String,
    },
    Remark: {
        type: String,
    },
    LeadId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Lead"
    }, 
    user:{
        type: mongoose.Schema.Types.ObjectId , 
        ref:"User"
    }
 
});

const task = mongoose.model('TaskModel', taskModel);

export default task;
