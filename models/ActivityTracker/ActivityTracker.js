import mongoose from "mongoose";

const breakSchema = new mongoose.Schema({
  start: String,
  end: String,
}, { _id: false });

const mySchema = new mongoose.Schema({
  userId: String,
  date: String,
  checkInTime: String,
  breaks: [breakSchema],
  checkOutTime: String,
  organizationId: String,
  task: String,
  status: {
    type: String
  },
});

const ActivityTracker = mongoose.model("ActivityTracker", mySchema);

export default ActivityTracker;
