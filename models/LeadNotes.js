import mongoose from "mongoose";

const mySchema = new mongoose.Schema({
   Status:{
    type:String ,
   } , 
   Date:{
    type:Date , 
    default:Date.now(),
   },
   Note:{
    type:String,
   },
   LeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },
  });

  const LeadNotes = mongoose.model("LeadNotes", mySchema);

  export default LeadNotes;