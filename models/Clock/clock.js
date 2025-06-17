import mongoose from 'mongoose';

const clockSchema = new mongoose.Schema({
    Date: {
        type: String,
    },
    user: {
        type: String,
        require: true
    },
    clockIn: {
        type: String,
    },
    clockOut: {
        type: String,
    },
    overTime: {
        type: String,
    },
    breakTime: {
        type: String,
    },
    Note: {
        type: String,
        default: ""
    },
    todayTask: {
        type: String,
        default: ""
    },
    organizationId: String
});

const Clock = mongoose.model('Clock', clockSchema);

export default Clock;
