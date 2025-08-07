import mongoose from "mongoose";


const FieldSchema = new mongoose.Schema({
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, required: true },
    required: { type: Boolean, default: false },
    placeholder: { type: String }
}, { _id: false });

const mySchema = new mongoose.Schema({
    name: { type: String, required: true },
    company: { type: String },
    description: { type: String },
    category: { type: String },
    image: { type: String },
    available: { type: Boolean },
    requiredFields: [FieldSchema]
}, { timestamps: true });

const products = mongoose.model("products", mySchema);

export default products;