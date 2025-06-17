import mongoose from "mongoose";

const mySchema = new mongoose.Schema(
  {
    clockIn: {
      type: String,
    },
    clockOut: {
      type: String,
    },
    totalTime: {
      type: String,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectTasks"
    },
    date: {
      type: String,
      default: Date.now()
    },
    Note: {
      type: String,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Projects"
    },
    submitedBy: String,
  },
  { timestamps: true }
);

const TaskTimer = mongoose.model("TaskTimer", mySchema);

export default TaskTimer;
