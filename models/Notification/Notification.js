import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    organizationId: {
        type: String,
        required: true,
    },
    userIds: [
        {
            type: String,
            required: true,
        }
    ],
    readBy: [
        {
            type: String,
        }
    ],
}, {
    timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
