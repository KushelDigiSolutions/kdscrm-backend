import mongoose from "mongoose";

const projectFileSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Projects",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: String,
      require: true
    },
  },
  { timestamps: true }
);

const ProjectFiles = mongoose.model("ProjectFiles", projectFileSchema);

export default ProjectFiles;
