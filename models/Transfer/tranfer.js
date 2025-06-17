import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema({
    branch: {
        type: String,
    }, userId: String,
    Employee: {
        type: String
    },
    Department: {
        type: String,
    },
    TransferDate: {
        type: String,
    },
    Description: {
        type: String,
    },
    organizationId: {
        type: String
    }

});

const Transfer = mongoose.model('Transfer', transferSchema);

export default Transfer;
