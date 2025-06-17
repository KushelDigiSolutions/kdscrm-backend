import mongoose from "mongoose";
const mySchema = new mongoose.Schema({
    Branch:{
        type:String
    },
    Department: {
        type: String
    },
    Designation:{
     type:String
    },
    businessProcessRating:{
        type:Number
    },
    projectManagemntRating:{
      type:Number
    },
    ts: {
        type: String,
        default: new Date().getTime()
    },
    status: {
        type: String,
        default: 'true'
    }
});

const Indicator = mongoose.model('Indicator', mySchema);

export default Indicator;
