import mongoose from "mongoose";


const mySchema = new mongoose.Schema({
  content: {
    type: String,
  },
  userId: {
    type: String
  },

}, { timestamps: true });

const OfferLetter = mongoose.model("Letter1", mySchema);

export default OfferLetter;