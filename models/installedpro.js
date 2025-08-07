import mongoose from "mongoose";

const FieldSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, required: true },
  required: { type: Boolean, default: false },
  placeholder: { type: String },
}, { _id: false });

const mySchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
  requiredFields: [FieldSchema],
  organizationId: { type: String, required: true },
  config: { type: mongoose.Schema.Types.Mixed }, // for dynamic config like apiKey, domain, etc.
  installedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const InstalledProducts = mongoose.model("InstalledProducts", mySchema);

export default InstalledProducts;
