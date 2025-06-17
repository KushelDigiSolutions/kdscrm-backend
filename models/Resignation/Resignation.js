import mongoose from 'mongoose';
import { type } from 'os';
const mySchema = new mongoose.Schema({
    Employee: {
        type: String,
    },
    userId: {
        type: String
    },
    noticeDate: {
        type: String
    },
    resignationDate: {
        type: String
    },
    description: {
        type: String
    },
    organizationId: String
});

const Resignation = mongoose.model('Resignation', mySchema);

export default Resignation;
