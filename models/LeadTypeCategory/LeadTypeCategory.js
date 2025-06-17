import mongoose from "mongoose";

const leadTypeCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  }
});

const LeadTypeCategory = mongoose.model("LeadTypeCategory", leadTypeCategorySchema);

export default LeadTypeCategory;
