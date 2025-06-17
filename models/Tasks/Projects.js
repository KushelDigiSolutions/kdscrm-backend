import mongoose from "mongoose";

const mySchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
    },
    projectOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    Status: {
      type: String,
      default: "Ongoing",
    },
    estimateHour: {
      type: String,

    },
    Members: [String],
    startDate: {
      type: String,
    },
    deadline: {
      type: String,
    },

    Description: {
      type: String,
    },
    organizationId: String,
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clients"
    }
  },
  { timestamps: true }
);

const Projects = mongoose.model("Projects", mySchema);

export default Projects;
