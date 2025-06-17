import mongoose from "mongoose";

const leadTypeSubCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LeadTypeCategory",
    required: true,
  }
});

const LeadTypeSubCategory = mongoose.model("LeadTypeSubCategory", leadTypeSubCategorySchema);

export default LeadTypeSubCategory;
