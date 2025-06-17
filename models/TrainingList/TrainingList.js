import mongoose from 'mongoose';
const mySchema = new mongoose.Schema({
    Branch: {
        type: String
    },
    user: {
        type:mongoose.Types.ObjectId,
        ref:"user"
    },
    trainerOption: {
        type: String,
    },
    trainingType: {
        type: String,

    },
    trainer: {
        type: String,
    },
    trainingCost: {
        type: String,
    },
    Employee: {
        type: String,
    },
    startDate:{
        type:String
    },
    endDate:{
        type:String
    },
    description:{
        type:String
    },
    status:{
        type:String,
        default:"Started"
    },
    performance:{
        type:String,
    },
    remarks:String
});

const TrainingList = mongoose.model('TrainingList', mySchema);

export default TrainingList;
