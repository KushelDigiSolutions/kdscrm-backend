import mongoose from 'mongoose';
const mySchema = new mongoose.Schema({
    complainFrom: {
        type: String,
    },
    complainAgain: {
        type: String
    },
    complainFromId: {
        type: String
    },
    complainAgainId: {
        type: String
    },
    title: {
        type: String
    },
    complainDate: {
        type: String
    },
    description: {
        type: String
    },
    organizationId: String
});

const Complain = mongoose.model('Complain', mySchema);

export default Complain;
