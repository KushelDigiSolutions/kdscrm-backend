import Ticket from "../models/Ticket.js";
import db from "../db/sql_conn.js";
import mongoose from "mongoose";

const successResponse = (res, data = null, message = 'Success', status = 200) => {
    return res.status(status).json({ success: true, message, data });
};

const errorResponse = (res, message = 'Error', status = 500) => {
    return res.status(status).json({ success: false, message });
};  

// 🎟️ Create Ticket
export const createTicket = async (req, res) => {
    try {
        // const { organizationId, userId } = req.user;
        // console.log('Creating ticket for org:', organizationId, 'by user:', userId);
        // const ticket = await Ticket.create({ ...req.body, organizationId, createdBy: userId });
        const ticket = await Ticket.create({ ...req.body });
        return successResponse(res, ticket, 'Ticket created successfully');
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// 📋 Get All Tickets
export const getAllTickets = async (req, res) => {
    try {
        const { organizationId } = req.user;

        // 1️⃣ Get tickets from MongoDB
        const tickets = await Ticket.find({ organizationId })
            .populate('Project').populate('createdBy').sort({ createdAt: -1 });

        if (!tickets.length) {
            return successResponse(res, []);
        }

        // 2️⃣ Extract unique user IDs from assignedTo field
        const assignedUserIds = tickets
            .filter(ticket => !!ticket.assignedTo)
            .map(ticket => ticket.assignedTo);

        // 3️⃣ Get user details from MySQL for all assigned users
        let assignedUsers = {};
        if (assignedUserIds.length > 0) {
            const [users] = await db.execute(
                `SELECT id, fullName, email, profileImage, designation 
         FROM users 
         WHERE id IN (${assignedUserIds.map(() => '?').join(',')})`,
                assignedUserIds
            );

            // Convert users array → object for faster lookup
            assignedUsers = users.reduce((acc, user) => {
                acc[user.id] = user;
                return acc;
            }, {});
        }

        // 4️⃣ Combine data (Mongo + MySQL)
        const enrichedTickets = tickets.map(ticket => {
            const t = ticket.toObject();

            t.assignedUser = t.assignedTo ? assignedUsers[t.assignedTo] || null : null;
            t.createdAtFormatted = ticket.createdAt.toLocaleString();
            t.updatedAtFormatted = ticket.updatedAt.toLocaleString();

            return t;
        });

        return successResponse(res, enrichedTickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        return errorResponse(res, error.message);
    }
};

// 🧾 Get Single Ticket with MySQL Member Details
export const getTicketById = async (req, res) => {
    try {
        const { id } = req.params;

        // 1️⃣ Fetch ticket from MongoDB (populate Project + createdBy)
        const ticket = await Ticket.findById(id)
            .populate("Project")
            .populate("createdBy");

        if (!ticket) return errorResponse(res, "Ticket not found", 404);

        // 2️⃣ Extract assigned user ID (if any)
        const assignedUserId = ticket.assignedTo ? [ticket.assignedTo] : [];

        // 3️⃣ Fetch Assigned User (from MySQL)
        let assignedUser = null;
        if (assignedUserId.length > 0) {
            const [users] = await db.execute(
                `SELECT id, fullName, email, profileImage, designation 
                 FROM users 
                 WHERE id IN (${assignedUserId.map(() => "?").join(",")})`,
                assignedUserId
            );
            if (users.length > 0) assignedUser = users[0];
        }

        // 4️⃣ Enrich Project Members (fetch from MySQL)
        let projectWithMembers = ticket.Project ? ticket.Project.toObject() : null;

        if (projectWithMembers && projectWithMembers.Members?.length > 0) {
            const memberIds = projectWithMembers.Members;

            const placeholders = memberIds.map(() => "?").join(",");
            const sql = `
                SELECT id, fullName, email, profileImage, designation
                FROM users
                WHERE id IN (${placeholders})
            `;

            const [members] = await db.execute(sql, [...memberIds]);

            projectWithMembers.Members = members.map((user) => ({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                profileImage: user.profileImage || null,
                designation: user.designation,
            }));
        }

        // 5️⃣ Combine Mongo + MySQL data
        const enrichedTicket = {
            ...ticket.toObject(),
            Project: projectWithMembers,
            assignedUser: assignedUser || null,
            createdAtFormatted: ticket.createdAt.toLocaleString(),
            updatedAtFormatted: ticket.updatedAt.toLocaleString(),
        };

        return successResponse(res, enrichedTicket);
    } catch (error) {
        console.error("Error fetching ticket:", error);
        return errorResponse(res, error.message);
    }
};



// 🧾 Get Client Tickets
export const getTicketByClientId = async (req, res) => {
    try {
        const { id } = req.params;

        // 1️⃣ Fetch tickets from MongoDB
        const tickets = await Ticket.find({ clientId: id })
            .populate('Project')
            .populate('createdBy')
            .sort({ createdAt: -1 });

        if (!tickets.length) {
            return errorResponse(res, 'No tickets found for this client', 404);
        }

        // 2️⃣ Extract assigned user IDs
        const assignedUserIds = tickets
            .filter(t => !!t.assignedTo)
            .map(t => t.assignedTo);

        // 3️⃣ Get user details from MySQL
        let assignedUsers = {};
        if (assignedUserIds.length > 0) {
            const [users] = await db.execute(
                `SELECT id, fullName, email, profileImage, designation 
                 FROM users 
                 WHERE id IN (${assignedUserIds.map(() => '?').join(',')})`,
                assignedUserIds
            );

            assignedUsers = users.reduce((acc, user) => {
                acc[user.id] = user;
                return acc;
            }, {});
        }

        // 4️⃣ Combine Mongo + MySQL data
        const enrichedTickets = tickets.map(ticket => {
            const t = ticket.toObject();

            t.assignedUser = t.assignedTo ? assignedUsers[t.assignedTo] || null : null;
            t.createdAtFormatted = ticket.createdAt.toLocaleString();
            t.updatedAtFormatted = ticket.updatedAt.toLocaleString();

            return t;
        });

        return successResponse(res, enrichedTickets);
    } catch (error) {
        console.error('Error fetching client tickets:', error);
        return errorResponse(res, error.message);
    }
};


// 🔧 Update Ticket (assign, resolve, close)
export const updateTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
        return successResponse(res, ticket, 'Ticket updated successfully');
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// ❌ Delete Ticket
export const deleteTicket = async (req, res) => {
    try {
        await Ticket.findByIdAndDelete(req.params.id);
        return successResponse(res, null, 'Ticket deleted successfully');
    } catch (error) {
        return errorResponse(res, error.message);
    }
};



/**
 * Assign ticket to agent
 */
export const assignTicket = async (req, res) => {
    try {
        const { assignedTo } = req.body;
        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { assignedTo, status: 'Assigned', updatedAt: Date.now() },
            { new: true }
        );
        if (!ticket) return errorResponse(res, 'Ticket not found', 404);
        return successResponse(res, ticket, 'Ticket assigned successfully');
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

/**
 * Start working on ticket (In Progress)
 */
export const startTicketWork = async (req, res) => {
    try {
        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { status: 'In Progress', updatedAt: Date.now() },
            { new: true }
        );
        return successResponse(res, ticket, 'Ticket marked In Progress');
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

/**
 * Mark ticket as Resolved
 */
export const resolveTicket = async (req, res) => {
    try {
        const { resolutionNote } = req.body;
        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { status: 'Resolved', resolutionNote, resolvedAt: Date.now(), updatedAt: Date.now() },
            { new: true }
        );
        return successResponse(res, ticket, 'Ticket marked as Resolved');
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

/**
 * Close ticket after user confirmation
 */
export const closeTicket = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            {
                status: 'Closed',
                feedback: { rating, comment },
                closedAt: Date.now(),
                updatedAt: Date.now()
            },
            { new: true }
        );
        return successResponse(res, ticket, 'Ticket closed successfully');
    } catch (error) {
        return errorResponse(res, error.message);
    }
};



// 📩 Add message to ticket thread
export const addMessageToTicket = async (req, res) => {
    try {
        const { message, senderId, senderType, attachments } = req.body;
        const { id } = req.params;

        const ticket = await Ticket.findByIdAndUpdate(
            id,
            {
                $push: {
                    messageThread: {
                        senderId,
                        senderType,
                        message,
                        attachments,
                        timestamp: new Date()
                    }
                },
                updatedAt: Date.now()
            },
            { new: true }
        );

        return successResponse(res, ticket, 'Message added successfully');
    } catch (error) {
        console.error('Error adding message:', error);
        return errorResponse(res, error.message);
    }
};



// 💬 Get message threads for a ticket
export const getMessageThreads = async (req, res) => {
    try {
        const { id } = req.params;

        // 1️⃣ Fetch ticket and its messageThread
        const ticket = await Ticket.findById(id)
            .populate("Project")
            .populate("createdBy");

        if (!ticket) return errorResponse(res, "Ticket not found", 404);

        const threads = ticket.messageThread || [];
        if (!threads.length) return successResponse(res, [], "No messages yet");

        // 2️⃣ Separate Client and Member sender IDs
        const clientIds = threads
            .filter((msg) => msg.senderType === "Client")
            .map((msg) => msg.senderId?.toString());

        const memberIds = threads
            .filter((msg) => msg.senderType === "Member")
            .map((msg) => msg.senderId?.toString());

        // 3️⃣ Fetch Client details from MongoDB (Clients collection)
        let clientData = {};
        if (clientIds.length > 0) {
            const Clients = mongoose.model("Clients");
            const clients = await Clients.find(
                { _id: { $in: clientIds } },
                "_id Name Email profileImage Company"
            );

            clientData = clients.reduce((acc, client) => {
                acc[client._id.toString()] = {
                    id: client._id.toString(),
                    fullName: client.Name,
                    email: client.Email,
                    profileImage: client.profileImage || null,
                    company: client.Company || null,
                    senderType: "Client"
                };
                return acc;
            }, {});
        }

        // 4️⃣ Fetch Member (Admin/User) details from MySQL
        let memberData = {};
        if (memberIds.length > 0) {
            // Normalize to string (MySQL safe)
            const normalizedIds = memberIds.map((id) => String(id));

            // Dynamically create placeholders
            const placeholders = normalizedIds.map(() => "?").join(",");

            const sql = `
                SELECT id, fullName, email, profileImage, designation 
                FROM users 
                WHERE id IN (${placeholders})
            `;

            // ✅ Use query instead of execute to prevent argument mismatch
            const [users] = await db.query(sql, normalizedIds);

            memberData = users.reduce((acc, user) => {
                acc[user.id.toString()] = {
                    id: user.id.toString(),
                    fullName: user.fullName,
                    email: user.email,
                    profileImage: user.profileImage || null,
                    designation: user.designation,
                    senderType: "Member"
                };
                return acc;
            }, {});
        }

        // 5️⃣ Merge sender details into threads
        const enrichedThreads = threads.map((msg) => {
            const msgObj = msg.toObject ? msg.toObject() : msg;
            const senderId = msg.senderId?.toString();

            let senderDetails = null;
            if (msg.senderType === "Client") {
                senderDetails = clientData[senderId] || null;
            } else if (msg.senderType === "Member") {
                senderDetails = memberData[senderId] || null;
            }

            return {
                ...msgObj,
                senderDetails,
                timestampFormatted: new Date(msg.timestamp).toLocaleString()
            };
        });

        return successResponse(res, enrichedThreads, "Success");
    } catch (error) {
        console.error("Error fetching message threads:", error);
        return errorResponse(res, error.message);
    }
};



// ✏️ Edit a message in a ticket thread
export const editMessageInTicket = async (req, res) => {
    try {
        const { id, messageId } = req.params;
        const { newMessage } = req.body;

        const ticket = await Ticket.findOneAndUpdate(
            { _id: id, "messageThread._id": messageId },
            {
                $set: {
                    "messageThread.$.message": newMessage,
                    "messageThread.$.timestamp": new Date()
                },
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!ticket) return errorResponse(res, 'Message not found', 404);

        return successResponse(res, ticket, 'Message updated successfully');
    } catch (error) {
        console.error('Error editing message:', error);
        return errorResponse(res, error.message);
    }
};


// 🗑️ Delete a message from a ticket thread
export const deleteMessageFromTicket = async (req, res) => {
    try {
        const { id, messageId } = req.params;

        const ticket = await Ticket.findByIdAndUpdate(
            id,
            {
                $pull: { messageThread: { _id: messageId } },
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!ticket) return errorResponse(res, 'Message not found or ticket missing', 404);

        return successResponse(res, ticket, 'Message deleted successfully');
    } catch (error) {
        console.error('Error deleting message:', error);
        return errorResponse(res, error.message);
    }
};
