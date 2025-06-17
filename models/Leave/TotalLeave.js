import mongoose from "mongoose";
const mySchema = new mongoose.Schema({
  hr: String,
  totalLeaves: String,
});

const TotalLeave = mongoose.model("TotalLeave", mySchema);

export default TotalLeave;
