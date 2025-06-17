import mongoose from 'mongoose';
const mySchema = new mongoose.Schema({
    Employee: {
        type: String,
    },
    Designation: {
        type: String
    },
    userId: {
        type: String
    },
    title: {
        type: String
    },
    promotionDate: {
        type: String
    },
    description: {
        type: String
    },
    organizationId: String
});

const Promotion = mongoose.model('Promotion', mySchema);

export default Promotion;
