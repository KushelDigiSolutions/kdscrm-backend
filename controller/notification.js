import Notification from "../models/Notification/Notification.js"
import db from "../db/sql_conn.js"
import mongoose from "mongoose";

export const createNotification = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { title, description, users = [], isLeave } = req.body;

        let userIds = [];

        if (isLeave) {
            if (!organizationId) {
                return res.status(400).json({
                    status: false,
                    message: 'organizationId is required for leave notifications',
                });
            }

            // 1. Get HR and Admins from SQL
            const [rows] = await db.execute(
                `SELECT id FROM users WHERE organizationId = ? AND (role = 'ADMIN' OR designation = 'HR')`,
                [organizationId]
            );


            if (rows.length === 0) {
                return res.status(404).json({
                    status: false,
                    message: 'No Admin or HR found for this organization',
                });
            }

            userIds = rows.map(user => String(user.id)); // SQL IDs as strings

        } else {
            // Normal flow – based on user fullNames
            if (!Array.isArray(users) || users.length === 0) {
                return res.status(400).json({
                    status: false,
                    message: 'Users array is required when isLeave is false',
                });
            }

            const placeholders = users.map(() => '?').join(', ');
            const [rows] = await db.execute(
                `SELECT id FROM users WHERE fullName IN (${placeholders})`,
                users
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    status: false,
                    message: 'No matching users found in SQL',
                });
            }

            userIds = rows.map(user => String(user.id));
        }

        // 2. Create Notification in MongoDB
        const newNotification = new Notification({
            title,
            description,
            userIds,
            organizationId,
        });

        const saved = await newNotification.save();

        return res.status(200).json({
            status: true,
            message: 'Notification created successfully',
            data: saved,
        });

    } catch (error) {
        console.error('Error in createNotification:', error);
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error',
        });
    }
};


export const getNotification = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                status: false,
                message: 'User ID is required',
            });
        }

        // 1. Fetch all notifications where user is involved
        const notifications = await Notification.find({ userIds: userId }).sort({ date: -1 });

        if (!notifications.length) {
            return res.status(200).json({
                status: true,
                message: 'No notifications found for this user',
                notifications: [],
            });
        }

        const now = Date.now();
        const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

        const notificationsToKeep = [];
        const notificationsToDelete = [];

        // 2. Separate what to keep vs delete
        for (const noti of notifications) {
            const allRead = noti.userIds.every(uid => noti.readBy?.includes(uid));
            const isOld = new Date(noti.date).getTime() + oneWeekMs < now;

            if (allRead && isOld) {
                notificationsToDelete.push(noti._id);
            } else {
                notificationsToKeep.push(noti);
            }
        }

        // 3. Delete notifications that are both old and fully read
        if (notificationsToDelete.length > 0) {
            await Notification.deleteMany({ _id: { $in: notificationsToDelete } });
        }

        // 4. Prepare list of all user IDs involved in remaining notifications
        const allUserIds = [
            ...new Set(notificationsToKeep.flatMap(n => n.userIds)),
        ];

        const placeholders = allUserIds.map(() => '?').join(', ');
        const [userRows] = await db.execute(
            `SELECT fullName, email, id, profileImage, role, designation FROM users WHERE id IN (${placeholders})`,
            allUserIds
        );

        const userMap = {};
        userRows.forEach(user => {
            userMap[user.id] = user;
        });

        // 5. Enrich final list
        const enrichedNotifications = notificationsToKeep.map(notification => {
            const fullUsers = notification.userIds.map(uid => userMap[uid]).filter(Boolean);
            return {
                _id: notification._id,
                title: notification.title,
                description: notification.description,
                date: new Date(notification.createdAt).getTime().toString(),
                user: fullUsers,
                IsRead: notification.readBy?.includes(userId),
                __v: notification.__v,
            };
        });

        return res.status(200).json({
            status: true,
            message: 'Notifications fetched successfully',
            notifications: enrichedNotifications,
        });

    } catch (error) {
        console.error('Error in getNotification:', error);
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error',
        });
    }
};

export const getNotificationHR = async (req, res) => {
    try {
        const { organizationId } = req.user;

        if (!organizationId) {
            return res.status(400).json({
                status: false,
                message: "organizationId is required"
            });
        }

        // 1. Get Admin from SQL
        const [adminRows] = await db.execute(
            "SELECT id, fullName, email FROM users WHERE organizationId = ? AND role = 'Admin' LIMIT 1",
            [organizationId]
        );

        if (adminRows.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No admin found for this organization"
            });
        }

        const admin = adminRows[0];

        // 2. Get notifications from MongoDB where admin's SQL id is present
        const notifications = await Notification.find({
            userIds: admin.id.toString() // Ensure it's string
        }).sort({ date: -1 });

        return res.status(200).json({
            status: true,
            message: "Notifications fetched successfully",
            admin: {
                id: admin.id,
                fullName: admin.fullName,
                email: admin.email
            },
            notifications
        });

    } catch (error) {
        console.error("Error in getNotificationHR:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const { userId, notId } = req.params;

        if (!userId || !notId) {
            return res.status(400).json({
                status: false,
                message: "userId and notId are required"
            });
        }

        const updatedNotification = await Notification.findOneAndUpdate(
            { _id: notId },
            { $pull: { userIds: userId } },
            { new: true }
        );

        if (!updatedNotification) {
            return res.status(404).json({
                status: false,
                message: "Notification not found"
            });
        }

        return res.status(200).json({
            status: true,
            message: "User removed from notification successfully",
            notification: updatedNotification
        });

    } catch (error) {
        console.error('Error in deleteNotification:', error);
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
};

export const markedNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        console.log(id, userId)

        if (!userId || !id) {
            return res.status(400).json({
                status: false,
                message: "userId and notification id are required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: false,
                message: "Invalid notification ID",
            });
        }

        const notification = await Notification.findById(id);

        if (!notification) {
            return res.status(404).json({
                status: false,
                message: "Notification not found",
            });
        }

        // If not already marked as read by this user, add userId to readBy array
        if (!notification.readBy?.includes(userId)) {
            notification.readBy = [...(notification.readBy || []), userId];
            await notification.save();
        }

        return res.status(200).json({
            status: true,
            message: "Notification marked as read",
            notification,
        });

    } catch (error) {
        console.error("Error in markedNotification:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
        });
    }
};