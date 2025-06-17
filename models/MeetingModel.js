import mongoose from 'mongoose';

const meetModel = new mongoose.Schema({

    title:{
        type: String,
    },
    meetDateFrom: {
        type: String , 
    },
    meetDateTo: {
        type: String , 
    },
    Status: {
        type: String,
    },
    meetTimeFrom:{
        type:String,
    },
    meetTimeTo:{
        type:String,
    },
    Host: {
        type: String,
    },
    RelatedTo: {
        type: String,
    },
    Participant: {
        type: String,
    },
    Note: {
        type: String,
    },
    user:{
        type: mongoose.Schema.Types.ObjectId , 
        ref:"User"
    } , 
    LeadId:{
         type: mongoose.Schema.Types.ObjectId , 
        ref:"Lead"
    } , 
    MeetingLink:{
        type:String ,
    }
 
});

const meet = mongoose.model('MeetModel', meetModel);

export default meet;
