import mongoose from "mongoose";

const mySchema = new mongoose.Schema({
  users: {
    type: Array,
    default: [],
  },
  messages: {
    type: Array,
    default: [],
  },
  ts: String,
  // isGroupChat- Boolean
});

const Chat = mongoose.model("Chat", mySchema);

export default Chat;
