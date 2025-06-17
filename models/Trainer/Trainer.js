import mongoose from 'mongoose';
const mySchema = new mongoose.Schema({
    Branch: {
        type: String
    },
    user: {
        type:mongoose.Types.ObjectId,
        ref:"user"
    },
    firstName: {
        type: String,
    },
    lastName: {
        type: String,

    },
    contact: {
        type: Number,
    },
    email: {
        type: String,
    },
    expertise: {
        type: String,
    },
    address:{
        type:String
    }
});

const Trainer = mongoose.model('Trainer', mySchema);

export default Trainer;
