import mongoose from "mongoose";


const mySchema = new mongoose.Schema({
  content: {
    type: String,
  },
  userId: String

}, { timestamps: true });

const RelivingLetter = mongoose.model("RelivingLetter", mySchema);

export default RelivingLetter;