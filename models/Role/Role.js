import mongoose from 'mongoose';

const mySchema = new mongoose.Schema({
    admin:String,
    user: String, // employee or user
    name: String,
});

const Role = mongoose.model('Role', mySchema);

export default Role;
