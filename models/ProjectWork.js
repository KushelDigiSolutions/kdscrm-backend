import mongoose from "mongoose";


const mySchema = new mongoose.Schema({
  Note:{
    type:String,
  } , 
  timeIn:{
    type:String,
  } , 
  timeOut:{
    type:String,
  } , 
  totalTime:{
    type:String,
  } , 
  user: {
    type:mongoose.Types.ObjectId,
    ref:"User"
},

taskId:{
    type: mongoose.Types.ObjectId , 
    ref:"ProjectTasks"
} , 
projectId:{
    type: mongoose.Types.ObjectId , 
    ref:"Projects"
} , 

  
  },{timestamps:true});

  const projectwork = mongoose.model("ProjectWork", mySchema);

  export default projectwork;