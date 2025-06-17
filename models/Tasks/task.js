import mongoose from "mongoose";

const mySchema = new mongoose.Schema(
  {
    taskName: {
      type: String,
    },
    startDate: {
      type: String,
    },
    dueDate: {
      type: String,
    },
    priority: {
      type: String,
      default: "Normal",
    },
    Members: [String],
    Project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Projects"
    },
    Status: {
      type: String,
      default: "Not Started"
    },
    description: {
      type: String,
    },
    taskfile: {
      type: String,
    },
    organizationId: String

  },
  { timestamps: true }
);

const Clients = mongoose.model("ProjectTasks", mySchema);

export default Clients;
