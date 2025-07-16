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


// import mongoose from "mongoose";

// const taskTimerSchema = new mongoose.Schema(
//   {
//     clockIn: {
//       type: Date, // use Date type for time math
//     },
//     clockOut: {
//       type: Date,
//     },
//     totalTime: {
//       type: Number, // store in ms
//       default: 0
//     },
//     status: {
//       type: String,
//       enum: ['running', 'paused', 'ended'],
//       default: 'running'
//     },
//     taskId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "ProjectTasks",
//       required: true
//     },
//     projectId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Projects",
//       required: true
//     },
//     Note: {
//       type: String,
//     },
//     submitedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Users", // or String, if not ObjectId
//       required: true
//     },
//     date: {
//       type: Date,
//       default: () => new Date() // set at save time
//     }
//   },
//   { timestamps: true }
// );

// const TaskTimer = mongoose.model("TaskTimer", taskTimerSchema);

// export default TaskTimer;
