import mongoose from "mongoose";


const mySchema = new mongoose.Schema({
  content: {
    type: String,
  },
  userId: {
    type: String
  },

}, { timestamps: true });

const ExperienceLetter = mongoose.model("ExperienceLetter", mySchema);

export default ExperienceLetter;