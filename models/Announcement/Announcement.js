import mongoose from "mongoose";

const mySchema = new mongoose.Schema({
  title: String,
  Branch: String,
  Department: {
    type: String
  },
  Employee: {
    type: String
  }
  , startDate: {
    type: String
  },
  endDate: {
    type: String
  },
  description: {
    type: String
  },
  organizationId: String
});

const Announcement = mongoose.model("Announcement", mySchema);

export default Announcement;
