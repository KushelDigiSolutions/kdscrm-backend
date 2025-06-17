import mongoose from 'mongoose';

const mySchema = new mongoose.Schema({
    admin:String,
    user: String, // employee or user
    name: String,
    time: String,
    ts: String,
    status: String,
    Note:String,
    noteDate:Date
});

const Task = mongoose.model('Task', mySchema);

export default Task;
