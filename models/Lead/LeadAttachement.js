import mongoose from "mongoose";

const mySchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    required: true,
  },
  file: {
    type: String,
    required: true,
  },
  name: String,
});

const LeadAttachement = mongoose.model("LeadAttachement", mySchema);

export default LeadAttachement;
