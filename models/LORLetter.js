import mongoose from "mongoose";


const mySchema = new mongoose.Schema({
  content: {
    type: String,
  },
  userId: {
    type: String
  },

}, { timestamps: true });

const OfferLetter = mongoose.model("LORLetter", mySchema);

export default OfferLetter;