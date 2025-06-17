import mongoose from "mongoose";


const mySchema = new mongoose.Schema({
  content:{
    type:String,
  } , 
  userId:String,
  
  },{timestamps:true});

  const OfferLetter = mongoose.model("PartTimeOffer", mySchema);

  export default OfferLetter;