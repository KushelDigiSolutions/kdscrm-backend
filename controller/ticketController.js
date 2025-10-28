import Ticket from "../models/Ticket.js";
import db from "../db/sql_conn.js";

const successResponse = (res, data = null, message = 'Success', status = 200) => {
    return res.status(status).json({ success: true, message, data });
};

const errorResponse = (res, message = 'Error', status = 500) => {
    return res.status(status).json({ success: false, message });
};

// 🎟️ Create Ticket
export const createTicket = async (req, res) => {
    try {
        // const { organizationId } = req.user;
        // const ticket = await Ticket.create({ ...req.body, organizationId });
        const ticket = await Ticket.create({ ...req.body });
        return successResponse(res, ticket, 'Ticket created successfully');
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// 📋 Get All Tickets
export const getAllTickets = async (req, res) => {
    try {
        const { organizationId } = req.body;

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

// 🧾 Get Single Ticket
export const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return errorResponse(res, 'Ticket not found', 404);
        return successResponse(res, ticket);
    } catch (error) {
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