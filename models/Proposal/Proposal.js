import mongoose from "mongoose";


const mySchema = new mongoose.Schema({
    UserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead'
    },
    content:{
      type:String, 
    },
    proposalFor:{
      type:String ,
    },
    preparedFor:{
      type:String , 
    },
    createdBy: {
      type:String , 
    },
    Date: {
      type:String, 
    },
  
  },{timestamps:true});

  const Quatation = mongoose.model("Proposal", mySchema);

  export default Quatation;