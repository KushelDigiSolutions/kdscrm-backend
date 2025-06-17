import mongoose from 'mongoose';

const mySchema =new mongoose.Schema({
    admin: String,
    user: String, // hr
    projectName: String,
    client: String,
    startDate: String,
    endDate: String,
    price: String,
    priority: String,
    projectLeader: Array, // array of object
    teamMembers: Array, // array of object
    description: String,
    file: {
        type: Array,
        default: []
    },
    status: {
        type: String,
        default: "active"
    },
    createdBy: {
        type: Object,
        default: {}
    }
});

const Project = mongoose.model('Project', mySchema);

export default Project;
