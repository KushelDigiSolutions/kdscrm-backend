import mongoose from "mongoose";


const mySchema = new mongoose.Schema({
  content: {
    type: String,
  },
  userId: String

}, { timestamps: true });

const OfferLetter = mongoose.model("FreelencerOffer", mySchema);

export default OfferLetter;