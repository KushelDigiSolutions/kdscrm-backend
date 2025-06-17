import mongoose, { mongo } from "mongoose";


const costheadSchema = new mongoose.Schema({
  description: {
    type: String,
  },
  price: {
    type: String,
  },
  total: {
    type: String,
  }
});

const timelineSchema =  new mongoose.Schema({
  description:{
    type: String,
  }
})

const technologySchema =  new mongoose.Schema({
  description:{
    type: String,
  },
  stack:{
    type:String,
  }
})

const mySchema = new mongoose.Schema({
    UserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead'
    },
    introduction:{
      type:String, 
    },
    additional:{
      type:String, 
    },
    customerName:{
      type:String , 
    },
    customerReq: {
      type:String , 
    },
   
    quotationDate: {
      type:String, 
    },
    costhead: [costheadSchema]  ,
    timeline: [timelineSchema] , 
    technology : [technologySchema],
    isSave:{
      type: Boolean, 
      default:false
    }
  },{timestamps:true});

  const Quatation = mongoose.model("Quatation", mySchema);

  export default Quatation;