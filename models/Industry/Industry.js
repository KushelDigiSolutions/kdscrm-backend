import mongoose from 'mongoose';

const mySchema = new mongoose.Schema({
    name:String
});

const Industry = mongoose.model('Industry', mySchema);

export default Industry;
