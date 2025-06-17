import mongoose from "mongoose";


const mySchema = new mongoose.Schema({
    content: {
        type: String,
    },
    userId: {
        type: String
    },

}, { timestamps: true });

const CompletionLetter = mongoose.model("CompletionLetter", mySchema);

export default CompletionLetter;