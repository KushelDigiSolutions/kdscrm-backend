import Lead from "../models/Lead/Lead.js";
import LeadTimeline from "../models/LeadTimeline.js";
import db from "../db/sql_conn.js"
import Deal from "../models/Deal.js"
import AccountModel from "../models/Account.js";


/**
 * Remove any keys whose value is exactly undefined
 * @param {object} obj 
 * @returns {object} new object without undefined values
 */
function removeUndefined(obj) {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== undefined)
    );
}

// Lead Section

export const createLead = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const {
            LeadOwner,
            LeadCreator,
            image,
            Company,
            FirstName,
            LastName,
            Title,
            Email,
            Phone,
            Fax,
            Mobile,
            Website,
            LeadSource,
            NoOfEmployee,
            Industry,
            LeadStatus,
            AnnualRevenue,
            Rating,
            EmailOptOut,
            SkypeID,
            SecondaryEmail,
            Twitter,
            Street,
            City,
            State,
            ZipCode,
            Country,
            LinkedIn,
            DescriptionInfo,
            date,
        } = req.body;

        const leadDetail = await Lead.create({
            LeadOwner,
            LeadCreator,
            Company,
            FirstName,
            LastName,
            Title,
            Email,
            Phone,
            Fax,
            Mobile,
            Website,
            LeadSource,
            NoOfEmployee,
            Industry,
            LeadStatus,
            AnnualRevenue,
            Rating,
            EmailOptOut,
            SkypeID,
            SecondaryEmail,
            Twitter,
            Street,
            City,
            State,
            ZipCode,
            Country,
            DescriptionInfo,
            image,
            date,
            LinkedIn,
            organizationId
        });
        console.log("Created", leadDetail.organizationId)
        const timeline = await LeadTimeline.create({
            leadId: leadDetail._id,
            action: "Lead Created",
            createdBy: req.user?.fullName || "System"
        });
        console.log(timeline._id)
        return res.status(201).json({
            status: true,
            message: "Successfully created",
            data: leadDetail,
        });
    } catch (error) {
        console.log("error ", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};

export const createExternalLead = async (req, res) => {
    try {
        const { id } = req.query;
        const { LeadOwner,
            LeadCreator,
            image,
            Company,
            FirstName,
            LastName,
            Title,
            Email,
            Phone,
            Fax,
            Mobile,
            Website,
            LeadSource,
            NoOfEmployee,
            Industry,
            LeadStatus,
            AnnualRevenue,
            Rating,
            EmailOptOut,
            SkypeID,
            SecondaryEmail,
            Twitter,
            Street,
            City,
            State,
            ZipCode,
            Country,
            LinkedIn,
            DescriptionInfo,
            date,
        } = req.body

        console.log("Payload =>  ", req.body);
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Please Add Required Field"
            })
        }
        const [organization] = await db.execute('SELECT * FROM organizations WHERE id = ?', [id]);
        if (organization.length === 0) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        const client = organization[0]
        const data = removeUndefined({
            LeadOwner,
            LeadCreator,
            image,
            Company,
            FirstName,
            LastName,
            Title,
            Email,
            Phone,
            Fax,
            Mobile,
            Website,
            LeadSource,
            NoOfEmployee,
            Industry,
            LeadStatus,
            AnnualRevenue,
            Rating,
            EmailOptOut,
            SkypeID,
            SecondaryEmail,
            Twitter,
            Street,
            City,
            State,
            ZipCode,
            Country,
            LinkedIn,
            DescriptionInfo,
            date,
        })
        data.organizationId = client.id;
        console.log("data => ", data);

        const leadDetail = await Lead.create(data);
        const timeline = await LeadTimeline.create({
            leadId: leadDetail._id,
            action: "Lead Created",
            createdBy: "System"
        });
        console.log(timeline._id)
        return res.status(201).json({
            status: true,
            message: "Successfully created",
            data: leadDetail,
        });
    } catch (error) {
        console.log("error ", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}

export const editLead = async (req, res) => {
    try {
        const { id } = req.params;
        const oldLead = await Lead.findById(id);
        if (!oldLead) {
            return res.status(404).json({ message: "Lead not found" });
        }

        const updates = req.body;
        const data = removeUndefined(updates);

        const leadDetail = await Lead.findByIdAndUpdate(id, data, { new: true });

        const updatedFields = Object.keys(data);
        let noteString = "";

        updatedFields.forEach((field) => {
            const oldVal = oldLead[field];
            const newVal = data[field];

            if (oldVal !== undefined && oldVal !== newVal) {
                noteString += `Field '${field}' updated from '${oldVal}' to '${newVal}'. `;
            }
        });

        // Only create a timeline entry if something was actually updated
        if (noteString.trim() !== "") {
            await LeadTimeline.create({
                leadId: id,
                action: "Lead Edited",
                createdBy: req.user?.fullName || "System",
                notes: [{ note: noteString.trim() }]
            });
        }

        return res.status(200).json({
            status: true,
            message: "Successfully updated",
            data: leadDetail
        });
    } catch (error) {
        console.log("error ", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

export const updateLeadStatus = async (req, res) => {
    try {
        const { LeadStatus } = req.body;
        const { id } = req.params;
        const leadDetail = await Lead.findByIdAndUpdate(
            id, { LeadStatus })
        const timeline = await LeadTimeline.create({
            leadId: id,
            action: `Lead Status update to ${LeadStatus}`,
            createdBy: req.user?.fullName || "System"
        });

        return res.status(200).json({
            status: true,
            message: "Successfully updated",
            data: leadDetail,
        });
    } catch (error) {
        console.log("error ", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
}

export const deleteLeads = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedLead = await Lead.findByIdAndDelete(id);

        if (!deletedLead) {
            return res.status(404).json({
                status: false,
                message: "Lead not found",
            });
        }

        return res.status(200).json({
            status: true,
            message: "Lead deleted successfully",
            data: deletedLead,
        });

    } catch (error) {
        console.error("Error deleting lead:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error while deleting lead",
            error: error.message,
        });
    }
};

export const getLead = async (req, res) => {
    try {
        const { id } = req.params;
        const lead = await Lead.findById(id);

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        // Get IDs
        const leadOwnerId = lead?.LeadOwner;
        const leadCreatorId = lead?.LeadCreator;

        // Fetch users from MySQL
        const [ownerRows] = leadOwnerId
            ? await db.execute("SELECT id, fullName, email FROM users WHERE id = ?", [leadOwnerId])
            : [[]];
        const [creatorRows] = leadCreatorId
            ? await db.execute("SELECT id, fullName, email FROM users WHERE id = ?", [leadCreatorId])
            : [[]];

        const leadPlain = lead.toObject();
        leadPlain.LeadOwner = ownerRows[0] || leadOwnerId;
        leadPlain.LeadCreator = creatorRows[0] || leadCreatorId;

        return res.status(200).json({
            success: true,
            message: "Lead fetched successfully",
            data: leadPlain,
        });
    } catch (error) {
        console.error("Error fetching lead:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

export const getAllLeads = async (req, res) => {
    try {
        const { organizationId } = req.user
        const leads = await Lead.find({ organizationId }).lean();

        const enrichedLeads = await Promise.all(
            leads.map(async (lead) => {
                const leadOwnerId = lead?.LeadOwner;
                const leadCreatorId = lead?.LeadCreator;

                // Fetch Lead Owner
                let owner = leadOwnerId
                    ? await db.execute("SELECT id, fullName, email FROM users WHERE id = ?", [leadOwnerId])
                    : [[]];

                // Fetch Lead Creator
                let creator = leadCreatorId
                    ? await db.execute("SELECT id, fullName, email FROM users WHERE id = ?", [leadCreatorId])
                    : [[]];

                return {
                    ...lead,
                    LeadOwner: owner[0][0] || leadOwnerId,
                    LeadCreator: creator[0][0] || leadCreatorId
                };
            })
        );

        return res.status(200).json({ success: true, leads: enrichedLeads });
    } catch (error) {
        console.error("Error in getAllLeads:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const getLeadTimeline = async (req, res) => {
    try {
        const { id } = req.params;

        const timeline = await LeadTimeline.find({ leadId: id }).sort({ createdAt: -1 });

        return res.status(200).json({
            status: true,
            message: "Timeline fetched successfully",
            data: timeline
        });
    } catch (err) {
        return res.status(500).json({ status: false, message: "Error fetching timeline", error: err.message });
    }
};

// Convert To Deals
export const convertLeadToDeal = async (req, res) => {
    try {
        const {
            accountName,
            dealName,
            amount,
            closingDate,
            stage,
            campaignSource,
            contactRole
        } = req.body;

        const { id: userId, organizationId, fullName } = req.user;
        const { leadId } = req.params;

        // 1. Validate Lead
        const lead = await Lead.findById(leadId);
        if (!lead) {
            return res.status(404).json({ status: false, message: "Lead not found" });
        }

        // 2. Check if Account already exists (case-insensitive match for accountName)
        const existingAccount = await AccountModel.findOne({
            accountName: { $regex: new RegExp(`^${accountName}$`, 'i') },
            organizationId
        });

        let account;

        if (existingAccount) {
            account = existingAccount;
        } else {
            // 3. Create new Account
            account = await AccountModel.create({
                accountName,
                organizationId,
                createdBy: userId
            });
        }

        // 4. Create Deal linked with Account and Lead
        const newDeal = await Deal.create({
            dealName,
            amount,
            closingDate,
            stage,
            campaignSource,
            contactRole,
            leadId,
            accountName: account._id,
            organizationId,
            createdBy: userId
        });

        // 5. Update Lead
        lead.status = "Converted";
        lead.closeDate = closingDate;
        await lead.save();

        // 6. Push to Timeline
        await LeadTimeline.create({
            leadId,
            action: "Converted to Deal",
            createdBy: fullName || "System"
        });

        return res.status(201).json({
            status: true,
            message: "Lead converted to deal successfully",
            data: newDeal
        });

    } catch (err) {
        console.error("Convert Lead Error:", err);
        return res.status(500).json({
            status: false,
            message: "Server Error",
            error: err.message
        });
    }
};

export const accountToDeal = async (req, res) => {
    try {
        const {
            accountName,
            dealName,
            amount,
            closingDate,
            stage,
            campaignSource,
            contactRole,
        } = req.body;

        const { id: userId, organizationId } = req.user;

        // Validate required fields
        if (!accountName || !dealName || !amount || !closingDate || !stage) {
            return res.status(400).json({
                status: false,
                message: "Missing required fields: accountName, dealName, amount, closingDate, stage",
            });
        }

        // Find the account by name
        const account = await AccountModel.findOne({ accountName, organizationId });
        if (!account) {
            return res.status(404).json({
                status: false,
                message: "Account not found",
            });
        }

        // Create new deal
        const newDeal = await Deal.create({
            dealName,
            amount,
            closingDate,
            stage,
            campaignSource: campaignSource || "",
            contactRole: contactRole || "",
            accountName: account._id,
            organizationId,
            createdBy: userId,
        });

        return res.status(201).json({
            status: true,
            message: "Lead converted to deal successfully",
            data: newDeal,
        });

    } catch (err) {
        console.error("Convert Lead Error:", err);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: err.message,
        });
    }
};

export const GetAllDeals = async (req, res) => {
    try {
        const { organizationId } = req.user;
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: "Organization Id is required"
            })
        }
        // Step 1: Fetch Deals with populated lead
        const deals = await Deal.find({ organizationId }).populate("leadId");

        // Step 2: Enrich each deal with LeadOwner and LeadCreator from MySQL
        const enrichedDeals = await Promise.all(
            deals.map(async (dealDoc) => {
                const deal = dealDoc.toObject(); // Convert Mongoose document to plain object

                const dealOwnerId = deal?.userId; // Make sure this field exists in your schema
                const leadCreatorId = deal.leadId?.LeadCreator;

                let ownerInfo = null;
                let creatorInfo = null;

                if (dealOwnerId) {
                    const [rows] = await db.execute("SELECT id, fullName, email FROM users WHERE id = ?", [dealOwnerId]);
                    ownerInfo = rows[0] || null;
                }

                if (leadCreatorId) {
                    const [rows] = await db.execute("SELECT id, fullName, email FROM users WHERE id = ?", [leadCreatorId]);
                    creatorInfo = rows[0] || null;
                }

                return {
                    ...deal,
                    LeadOwner: ownerInfo || dealOwnerId,
                    DealCreator: creatorInfo || leadCreatorId
                };
            })
        );

        return res.status(200).json({ success: true, deals: enrichedDeals });

    } catch (error) {
        console.error("Error in GetAllDeals:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const getDeal = async (req, res) => {
    try {
        const { id } = req.params;
        const deal = await Deal.findById(id).populate("leadId");
        if (!deal) {
            return res.status(404).json({
                success: false,
                message: "Lead not found",
            });
        }

        // Get IDs
        const dealOwnerId = deal?.userId;
        const leadCreatorId = deal.leadId?.LeadCreator;

        // Fetch users from MySQL
        const [ownerRows] = dealOwnerId
            ? await db.execute("SELECT id, fullName, email FROM users WHERE id = ?", [dealOwnerId])
            : [[]];
        const [creatorRows] = leadCreatorId
            ? await db.execute("SELECT id, fullName, email FROM users WHERE id = ?", [leadCreatorId])
            : [[]];

        const leadPlain = deal.toObject();
        leadPlain.LeadOwner = ownerRows[0] || dealOwnerId;
        leadPlain.LeadCreator = creatorRows[0] || leadCreatorId;

        return res.status(200).json({
            success: true,
            message: "Lead fetched successfully",
            data: leadPlain,
        });

    } catch (error) {
        console.error("Error in GetAllDeals:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

export const editDeal = async (req, res) => {
    try {
        const { id } = req.params;
        const oldLead = await Deal.findById(id);
        if (!oldLead) {
            return res.status(404).json({ message: "Deal not found" });
        }

        const updates = req.body;
        const data = removeUndefined(updates);

        const leadDetail = await Deal.findByIdAndUpdate(id, data, { new: true });

        const updatedFields = Object.keys(data);
        let noteString = "";

        updatedFields.forEach((field) => {
            const oldVal = oldLead[field];
            const newVal = data[field];

            if (oldVal !== undefined && oldVal !== newVal) {
                noteString += `Field '${field}' updated from '${oldVal}' to '${newVal}'. `;
            }
        });

        // Only create a timeline entry if something was actually updated
        if (noteString.trim() !== "") {
            await LeadTimeline.create({
                leadId: id,
                action: "Deal Edited",
                createdBy: req.user?.fullName || "System",
                notes: [{ note: noteString.trim() }]
            });
        }

        return res.status(200).json({
            status: true,
            message: "Successfully updated",
            data: leadDetail
        });
    } catch (error) {
        console.log("error ", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}


// TimeLine Notes

export const createTimeLineNote = async (req, res) => {
    try {
        const { timelineId } = req.params;
        const { note } = req.body;

        if (!note) {
            return res.status(400).json({ success: false, message: "Note is required" });
        }

        const timeline = await LeadTimeline.findById(timelineId);
        if (!timeline) {
            return res.status(404).json({ success: false, message: "Timeline not found" });
        }

        timeline.notes.push({ note }); // ✅ wrap as object
        await timeline.save();

        res.status(200).json({ success: true, message: "Note added", data: timeline.notes });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

export const getTimelineNotes = async (req, res) => {
    try {
        const { timelineId } = req.params;

        const timeline = await LeadTimeline.findById(timelineId);
        if (!timeline) {
            return res.status(404).json({ success: false, message: "Timeline not found" });
        }

        res.status(200).json({ success: true, data: timeline.notes });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Update a specific note by index
export const updateTimelineNote = async (req, res) => {
    try {
        const { timelineId, noteIndex } = req.params;
        const { note } = req.body;

        if (!note) {
            return res.status(400).json({ success: false, message: "Note is required" });
        }

        const timeline = await LeadTimeline.findById(timelineId);
        if (!timeline || !timeline.notes[noteIndex]) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        timeline.notes[noteIndex].note = note;
        timeline.notes[noteIndex].updatedAt = new Date();
        await timeline.save();

        res.status(200).json({ success: true, message: "Note updated", data: timeline.notes[noteIndex] });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// Delete a specific note by index
export const deleteTimelineNote = async (req, res) => {
    try {
        const { timelineId, noteIndex } = req.params;

        const timeline = await LeadTimeline.findById(timelineId);
        if (!timeline || !timeline.notes[noteIndex]) {
            return res.status(404).json({ success: false, message: "Note not found" });
        }

        timeline.notes.splice(noteIndex, 1);
        await timeline.save();

        res.status(200).json({ success: true, message: "Note deleted", data: timeline.notes });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};



// Create Account
export const createAccount = async (req, res) => {
    try {
        const {
            accountOwner,
            accountName,
            parentAccount,
            accountNumber,
            website,
            tickerSymbol,
            accountType,
            ownership,
            industry,
            annualRevenue,
            sicCode,
            exchangeRate,
            currency,
            billingStreet,
            billingCity,
            billingState,
            billingCode,
            billingCountry,
            shippingStreet,
            shippingCity,
            shippingState,
            shippingCode,
            shippingCountry, description
        } = req.body;
        const { organizationId } = req.user

        const newAccount = new AccountModel({
            accountOwner,
            accountName,
            parentAccount,
            accountNumber,
            website,
            tickerSymbol,
            accountType,
            ownership,
            industry,
            annualRevenue,
            sicCode,
            exchangeRate,
            currency,
            description,
            billingStreet,
            billingCity,
            billingState,
            billingCode,
            billingCountry,
            shippingStreet,
            shippingCity,
            shippingState,
            shippingCode,
            shippingCountry,
            description,
            organizationId
        });

        await newAccount.save();
        return res.status(201).json({
            success: true,
            message: 'Account created successfully',
            account: newAccount
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update Account
export const updateAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            accountOwner,
            accountName,
            parentAccount,
            accountNumber,
            website,
            tickerSymbol,
            accountType,
            ownership,
            industry,
            annualRevenue,
            sicCode,
            exchangeRate,
            currency,
            description,
            billingStreet,
            billingCity,
            billingState,
            billingCode,
            billingCountry,
            shippingStreet,
            shippingCity,
            shippingState,
            shippingCode,
            shippingCountry

        } = req.body;

        const updatedData = {
            accountOwner,
            accountName,
            parentAccount,
            accountNumber,
            website,
            tickerSymbol,
            accountType,
            ownership,
            industry,
            annualRevenue,
            sicCode,
            exchangeRate,
            currency,
            description,
            billingStreet,
            billingCity,
            billingState,
            billingCode,
            billingCountry,
            shippingStreet,
            shippingCity,
            shippingState,
            shippingCode,
            shippingCountry
        };

        const updatedAccount = await AccountModel.findByIdAndUpdate(
            id,
            updatedData,
            { new: true, runValidators: true }
        );

        if (!updatedAccount) {
            return res.status(404).json({ message: 'Account not found' });
        }
        return res.status(200).json({ success: true, message: 'Account updated successfully', account: updatedAccount });
    } catch (error) {
        return res.status(400).json({ success: false, message: 'Error updating account', error: error.message });
    }
};

// Get All Acounts  
export const getAllAccounts = async (req, res) => {
    try {
        const { organizationId } = req.user;

        // Fetch accounts by organizationId and populate parentAccount
        const accounts = await AccountModel.find({ organizationId }).populate('parentAccount');

        return res.status(200).json({
            success: true,
            message: "Accounts fetched successfully",
            data: accounts,
        });
    } catch (error) {
        console.error("Error fetching accounts:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch accounts",
            error: error.message,
        });
    }
};

// Get Single Account
export const getAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await AccountModel.findById(id).populate('parentAccount')
        return res.status(200).json({
            success: true,
            message: "Accounts fetched successfully",
            data: account,
        });
    } catch (error) {

    }
}

// Delete A Account
export const deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;
        await AccountModel.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Account deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting account:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to delete account",
            error: error.message,
        });
    }
};