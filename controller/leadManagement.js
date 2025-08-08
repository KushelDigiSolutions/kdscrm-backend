import Lead from "../models/Lead/Lead.js";
import LeadTimeline from "../models/LeadTimeline.js";
import db from "../db/sql_conn.js"
import Deal from "../models/Deal.js"
import AccountModel from "../models/Account.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import LeadAttachement from "../models/Lead/LeadAttachement.js";


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
            contactRole,
            createNewDeal,
        } = req.body;

        const { id: userId, organizationId, fullName } = req.user;
        const { leadId } = req.params;

        // 1. Validate Lead
        const lead = await Lead.findById(leadId);
        if (!lead) {
            return res
                .status(404)
                .json({ status: false, message: "Lead not found" });
        }

        let accountId = null;

        if (!createNewDeal) {
            // 2. Check if Account already exists (case-insensitive)
            const existingAccount = await AccountModel.findOne({
                accountName: { $regex: new RegExp(`^${accountName}$`, "i") },
                organizationId,
            });

            let account;

            if (existingAccount) {
                account = existingAccount;
            } else {
                // 3. Create new Account
                account = await AccountModel.create({
                    accountName,
                    organizationId,
                    createdBy: userId,
                });
            }

            accountId = account._id;
        }

        // 4. Create Deal (with or without Account)
        const newDeal = await Deal.create({
            dealName,
            amount,
            closingDate,
            stage,
            campaignSource,
            contactRole,
            leadId,
            accountName: accountId,
            organizationId,
            createdBy: userId,
        });

        // 5. Update Lead
        lead.status = "Converted";
        lead.closeDate = closingDate;
        await lead.save();

        // 6. Timeline
        await LeadTimeline.create({
            leadId,
            action: "Converted to Deal",
            createdBy: fullName || "System",
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
            message: "Server Error",
            error: err.message,
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
            message: "Deal fetched successfully",
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

        // Fetch accounts and populate parent account
        const accounts = await AccountModel.find({ organizationId }).populate('parentAccount');

        // Enrich accounts with lead owner details
        const enrichedLeads = await Promise.all(
            accounts.map(async (lead) => {
                const leadObj = lead.toObject(); // Convert Mongoose doc to plain JS object
                const accountOwner = lead?.accountOwner;

                let owner = [[]];
                if (accountOwner) {
                    owner = await db.execute(
                        "SELECT id, fullName, email FROM users WHERE id = ?",
                        [accountOwner]
                    );
                }

                // Optional: Fetch lead creator if needed
                // const creator = await db.execute(...);

                return {
                    ...leadObj,
                    accountOwner: owner[0][0] || null, // Fallback to null if not found
                    // LeadCreator: creator[0][0] || null,
                };
            })
        );

        return res.status(200).json({
            success: true,
            message: "Accounts fetched successfully",
            data: enrichedLeads,
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



// controllers/metaWebhookController.js

import axios from "axios";
import InstalledProducts from "../models/installedpro.js";


const FB_API_VERSION = process.env.FB_API_VERSION || "v17.0";

/**
 * Handle GET & POST webhook using InstalledProducts config stored for org
 * Route: /meta/installed-webhook/:orgId
 */
export const handleInstalledMetaWebhook = async (req, res) => {
    const { orgId } = req.params;

    const [leadOwner] = await db.execute(
        "SELECT id FROM users WHERE organizationId = ? AND Role = 'ADMIN' LIMIT 1",
        [orgId]
    );
    // find the installed product config for this organization and product name
    // you can change filter if you store multiple integrations per org
    const installed = await InstalledProducts.findOne({
        organizationId: orgId,
        name: "Facebook Lead Integration"
    });

    if (!installed) {
        // If no integration installed for this org, reject verification and ignore posts
        if (req.method === "GET") return res.sendStatus(404);
        if (req.method === "POST") return res.status(200).send("No integration for org");
    }

    const config = installed.config || {};
    const storedVerifyToken = config.verifyToken;
    const storedAccessToken = config.accessToken;
    const storedPageId = config.pageId; // optional if you auto-fetch pageId elsewhere

    // ---------- GET (verification) ----------
    if (req.method === "GET") {
        try {
            const mode = req.query["hub.mode"];
            const token = req.query["hub.verify_token"];
            const challenge = req.query["hub.challenge"];

            if (mode === "subscribe" && token && token === storedVerifyToken) {
                return res.status(200).send(challenge);
            } else {
                console.warn("Webhook verify failed for org", orgId);
                return res.sendStatus(403);
            }
        } catch (err) {
            console.error("Webhook GET error:", err);
            return res.sendStatus(500);
        }
    }

    // ---------- POST (events) ----------
    if (req.method === "POST") {
        try {
            const body = req.body;
            const entries = body.entry || [];

            for (const entry of entries) {
                // Facebook sometimes sends page id as entry.id or change.value.page_id
                const pageIdFromEntry = entry.id || entry.changes?.[0]?.value?.page_id;

                // If you want to check pageId matches installed config (optional)
                if (storedPageId && pageIdFromEntry && storedPageId !== pageIdFromEntry) {
                    console.warn(`PageId mismatch for org ${orgId}: entry ${pageIdFromEntry} != stored ${storedPageId}`);
                    // continue to next entry (or continue processing anyway if you support multiple pages)
                }

                for (const change of entry.changes || []) {
                    if (change.field !== "leadgen") continue;

                    const leadgenId = change.value?.leadgen_id;
                    if (!leadgenId) {
                        console.warn("No leadgen_id in change");
                        continue;
                    }

                    // --- fetch lead details from Graph API using stored access token ---
                    try {
                        const url = `https://graph.facebook.com/${FB_API_VERSION}/${leadgenId}`;
                        const fbRes = await axios.get(url, {
                            params: {
                                access_token: storedAccessToken,
                                fields: "id,ad_id,form_id,created_time,field_data"
                            }
                        });

                        const leadData = fbRes.data;
                        // Map FB data to your Lead model fields
                        const mapped = mapFbLeadToLeadObj(leadData);

                        // add org and meta info
                        mapped.organizationId = mongoose.Types.ObjectId(orgId); // ensure object id type
                        mapped.LeadSource = mapped.LeadSource || "Meta:LeadAds";
                        mapped.metaLeadId = leadData.id;
                        // you can set LeadOwner default from installed.config if provided

                        // DEDUPE: check if metaLeadId already exists
                        const already = await Lead.findOne({ metaLeadId: mapped.metaLeadId });
                        if (already) {
                            console.log("Duplicate meta lead, skipping:", mapped.metaLeadId);
                            continue;
                        }

                        // Create lead (matches your createLead fields)
                        const leadDetail = await Lead.create({
                            LeadOwner: leadOwner[0]?.id,
                            LeadCreator: mapped.LeadCreator,
                            image: mapped.image,
                            Company: mapped.Company,
                            FirstName: mapped.FirstName,
                            LastName: mapped.LastName,
                            Title: mapped.Title,
                            Email: mapped.Email,
                            Phone: mapped.Phone,
                            Fax: mapped.Fax,
                            Mobile: mapped.Mobile,
                            Website: mapped.Website,
                            LeadSource: mapped.LeadSource,
                            NoOfEmployee: mapped.NoOfEmployee,
                            Industry: mapped.Industry,
                            LeadStatus: mapped.LeadStatus,
                            AnnualRevenue: mapped.AnnualRevenue,
                            Rating: mapped.Rating,
                            EmailOptOut: mapped.EmailOptOut,
                            SkypeID: mapped.SkypeID,
                            SecondaryEmail: mapped.SecondaryEmail,
                            Twitter: mapped.Twitter,
                            Street: mapped.Street,
                            City: mapped.City,
                            State: mapped.State,
                            ZipCode: mapped.ZipCode,
                            Country: mapped.Country,
                            LinkedIn: mapped.LinkedIn,
                            DescriptionInfo: mapped.DescriptionInfo,
                            date: mapped.date || new Date(),
                            metaLeadId: mapped.metaLeadId,
                            organizationId: mapped.organizationId
                        });

                        await LeadTimeline.create({
                            leadId: leadDetail._id,
                            action: "Lead Created (Meta)",
                            createdBy: "MetaWebhook"
                        });

                        console.log("Created lead for org", orgId, "leadId:", leadDetail._id);
                    } catch (err) {
                        console.error("Error fetching lead from FB or creating lead:", err?.response?.data || err.message);
                        // continue with other changes/entries
                    }
                }
            }

            // respond 200 to FB quickly
            return res.status(200).send("EVENT_RECEIVED");
        } catch (err) {
            console.error("Webhook POST error:", err);
            return res.sendStatus(500);
        }
    }

    // Method not allowed
    return res.sendStatus(405);
};


/** Helper: map FB lead response to your Lead schema keys */
function mapFbLeadToLeadObj(fbLeadResponse) {
    const obj = {};
    const fields = fbLeadResponse.field_data || [];

    for (const f of fields) {
        const name = (f.name || "").toLowerCase();
        const val = Array.isArray(f.values) ? f.values[0] : f.values || f.value;

        // common mappings — extend as needed
        if (name.includes("first")) obj.FirstName = val;
        else if (name.includes("last")) obj.LastName = val;
        else if (name.includes("email")) obj.Email = val;
        else if (name.includes("phone") || name.includes("mobile")) obj.Phone = val;
        else if (name.includes("company") || name.includes("organization")) obj.Company = val;
        else if (name.includes("title")) obj.Title = val;
        else obj.DescriptionInfo = (obj.DescriptionInfo ? obj.DescriptionInfo + "\n" : "") + `${f.name}: ${val}`;
    }

    // fallback fields
    if (fbLeadResponse.created_time) obj.date = fbLeadResponse.created_time;
    if (fbLeadResponse.ad_id) obj.DescriptionInfo = (obj.DescriptionInfo ? obj.DescriptionInfo + "\n" : "") + `ad_id: ${fbLeadResponse.ad_id}`;

    return obj;
}



/**
 * Google Lead webhook handler (POST /lead/google/installed-webhook/:orgId?key=...)
 */
export const handleGoogleLeadWebhook = async (req, res) => {
    const { orgId } = req.params;

    try {
        const installed = await InstalledProducts.findOne({
            organizationId: orgId,
            name: "Google Lead Integration",
        });

        if (!installed) {
            console.warn("No Google integration for org:", orgId);
            return res.status(404).send("Integration not found");
        }

        const [leadOwner] = await db.execute(
            "SELECT id FROM users WHERE organizationId = ? AND Role = 'ADMIN' LIMIT 1",
            [orgId]
        );

        const config = installed.config || {};
        const storedKey = config.verifyKey || config.verifyToken || "";

        // Verify incoming key (query param ?key=...)
        const incomingKey = req.query?.key || req.get("x-google-key") || req.body?.key;
        if (!incomingKey || incomingKey !== storedKey) {
            console.warn("Invalid Google webhook key for org:", orgId);
            return res.status(403).send("Invalid key");
        }

        const payload = req.body;
        if (!payload) return res.status(400).send("No payload");

        // normalize user_column_data to a map for easy lookup
        const userColumns = payload.user_column_data || payload.userData || [];
        const data = {};
        for (const c of userColumns) {
            const name = (c.column_name || c.name || "").toString().trim().toLowerCase();
            const val = c.string_value || c.value || "";
            if (name) data[name] = val;
        }

        // Helper to get value by many possible column names
        const get = (...keys) => {
            for (let k of keys) {
                k = k.toString().toLowerCase();
                if (data[k]) return data[k];
            }
            return "";
        };

        // Map to your Lead fields
        const mapped = {
            LeadOwner: leadOwner[0]?.id,
            LeadCreator: null,
            image: null,
            Company: get("company", "company_name", "organization"),
            FirstName: get("first_name", "firstname", "given_name") || (() => {
                const full = get("full_name", "name");
                if (full) return full.split(" ")[0];
                return "";
            })(),
            LastName: get("last_name", "lastname") || (() => {
                const full = get("full_name", "name");
                if (full) {
                    const parts = full.split(" ");
                    parts.shift();
                    return parts.join(" ");
                }
                return "";
            })(),
            Title: get("job_title", "title"),
            Email: get("email", "email_address"),
            Phone: get("phone_number", "phone", "mobile"),
            Fax: get("fax"),
            Mobile: get("mobile", "phone_number"),
            Website: get("website", "url"),
            LeadSource: "Google:LeadForm",
            NoOfEmployee: get("employee_count", "no_of_employees"),
            Industry: get("industry"),
            LeadStatus: get("lead_status") || null,
            AnnualRevenue: get("annual_revenue", "revenue"),
            Rating: get("rating"),
            EmailOptOut: false,
            SkypeID: get("skype"),
            SecondaryEmail: get("secondary_email"),
            Twitter: get("twitter"),
            Street: get("street", "address_line1"),
            City: get("city"),
            State: get("state", "region"),
            ZipCode: get("postal_code", "zip", "zip_code"),
            Country: get("country"),
            LinkedIn: get("linkedin"),
            DescriptionInfo: "",
            date: payload.event_time || payload.lead_submit_time || new Date().toISOString(),
        };

        // Add any leftover unknown fields into DescriptionInfo
        for (const k of Object.keys(data)) {
            // skip ones we've already mapped
            const mappedKeys = [
                "first_name", "firstname", "given_name", "last_name", "lastname", "full_name", "name",
                "email", "email_address", "phone_number", "phone", "mobile",
                "company", "company_name", "organization", "job_title", "title",
                "website", "url", "employee_count", "no_of_employees", "industry",
                "annual_revenue", "revenue", "rating", "skype", "secondary_email", "twitter",
                "street", "address_line1", "city", "state", "region", "postal_code", "zip", "zip_code", "country", "linkedin", "description"
            ];
            if (!mappedKeys.includes(k)) {
                mapped.DescriptionInfo += `${k}: ${data[k]}\n`;
            }
        }

        // metaLeadId
        const metaLeadId = payload.lead_id || payload.leadId || payload.id;
        if (metaLeadId) mapped.metaLeadId = metaLeadId;

        // organizationId as ObjectId
        try {
            mapped.organizationId = mongoose.Types.ObjectId(orgId);
        } catch (e) {
            // If orgId is not a valid ObjectId, just set raw string (depends on your schema)
            mapped.organizationId = orgId;
        }

        // Dedupe by metaLeadId
        if (mapped.metaLeadId) {
            const exists = await Lead.findOne({ metaLeadId: mapped.metaLeadId });
            if (exists) {
                console.log("Duplicate Google lead, skipping:", mapped.metaLeadId);
                return res.status(200).send("Duplicate");
            }
        }

        // Optional fallback dedupe by email + org
        if (!mapped.metaLeadId && mapped.Email) {
            const existsByEmail = await Lead.findOne({ Email: mapped.Email, organizationId: mapped.organizationId });
            if (existsByEmail) {
                console.log("Lead exists by email, skipping:", mapped.Email);
                return res.status(200).send("Exists");
            }
        }

        // Create lead using same fields as your createLead controller expects
        const leadDetail = await Lead.create({
            LeadOwner: mapped.LeadOwner,
            LeadCreator: mapped.LeadCreator,
            image: mapped.image,
            Company: mapped.Company,
            FirstName: mapped.FirstName,
            LastName: mapped.LastName,
            Title: mapped.Title,
            Email: mapped.Email,
            Phone: mapped.Phone,
            Fax: mapped.Fax,
            Mobile: mapped.Mobile,
            Website: mapped.Website,
            LeadSource: mapped.LeadSource,
            NoOfEmployee: mapped.NoOfEmployee,
            Industry: mapped.Industry,
            LeadStatus: mapped.LeadStatus,
            AnnualRevenue: mapped.AnnualRevenue,
            Rating: mapped.Rating,
            EmailOptOut: mapped.EmailOptOut,
            SkypeID: mapped.SkypeID,
            SecondaryEmail: mapped.SecondaryEmail,
            Twitter: mapped.Twitter,
            Street: mapped.Street,
            City: mapped.City,
            State: mapped.State,
            ZipCode: mapped.ZipCode,
            Country: mapped.Country,
            LinkedIn: mapped.LinkedIn,
            DescriptionInfo: mapped.DescriptionInfo,
            date: mapped.date,
            metaLeadId: mapped.metaLeadId,
            organizationId: mapped.organizationId
        });

        // Timeline entry
        await LeadTimeline.create({
            leadId: leadDetail._id,
            action: "Lead Created (Google)",
            createdBy: "GoogleWebhook"
        });

        console.log("Google lead created:", leadDetail._id);
        return res.status(200).send("OK");
    } catch (err) {
        console.error("Google webhook error:", err);
        return res.status(500).send("Server error");
    }
};



// controllers/googleLead.controller.js

export const googleLeadWebhook = async (req, res) => {
    try {
        // Webhook Verification (if required)
        if (req.method === "GET") {
            // For initial verification
            return res.status(200).send(req.query.challenge);
        }

        const GOOGLE_SECRET = process.env.GOOGLE_LEAD_SECRET;

        // Optional: Validate using secret key if you're using HMAC
        const receivedKey = req.headers['x-goog-auth-token'];
        if (receivedKey !== GOOGLE_SECRET) {
            return res.status(403).json({ message: "Unauthorized webhook" });
        }

        const leadData = req.body;

        // ✅ Map Google Lead fields to your CRM schema
        const mappedLead = {
            LeadOwner: "Google Ads", // default or mapped owner
            LeadCreator: "System",
            Company: leadData.companyName || "Unknown Company",
            FirstName: leadData.firstName || "",
            LastName: leadData.lastName || "",
            Email: leadData.email || "",
            Phone: leadData.phoneNumber || "",
            LeadSource: "Google Ads",
            LeadStatus: "New",
            organizationId: getOrganizationIdFromGoogleLead(leadData),
            // Add other fields as needed
        };

        // Injecting mapped data into req.body and req.user mock
        req.body = mappedLead;
        req.user = { organizationId: mappedLead.organizationId, fullName: "System" };

        // Reuse existing logic
        return await createLead(req, res);
    } catch (err) {
        console.error("Error receiving Google lead:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// 🎯 Custom logic to map Google Lead to organizationId
function getOrganizationIdFromGoogleLead(lead) {
    const campaignMap = {
        'campaignId1': 'orgId1',
        'campaignId2': 'orgId2',
    };
    return campaignMap[lead.campaignId] || 'defaultOrgId';
}



// import LeadAttachement from "./path-to-model";
// import { uploadToCloudinary } from "./path-to-cloudinary-utils"; // your existing cloudinary upload function

// CREATE: Upload file to Cloudinary, then create LeadAttachment doc
export const createLeadAttachment = async (req, res) => {
    try {
        const { leadId, name } = req.body;
        const { file } = req.files; // assuming form-data with file field named 'file'

        if (!file) return res.status(400).json({ message: "File is required" });
        if (!leadId) return res.status(400).json({ message: "leadId is required" });

        // Upload file to Cloudinary
        const uploadResult = await uploadToCloudinary(file.tempFilePath);

        // Create document with Cloudinary URL
        const newAttachment = await LeadAttachement.create({
            leadId,
            name,
            file: uploadResult.secure_url,
        });

        return res.status(201).json({ status: true, data: newAttachment });
    } catch (error) {
        console.error("Error creating LeadAttachment:", error);
        return res.status(500).json({ status: false, message: "Server Error" });
    }
};

// READ ALL attachments for a Lead
export const getAttachmentsByLeadId = async (req, res) => {
    try {
        const { leadId } = req.params;
        const attachments = await LeadAttachement.find({ leadId });
        return res.status(200).json({ status: true, data: attachments });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Server Error" });
    }
};

// READ ONE attachment by id
export const getAttachmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const attachment = await LeadAttachement.findById(id);
        if (!attachment) return res.status(404).json({ message: "Not found" });
        return res.status(200).json({ status: true, data: attachment });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Server Error" });
    }
};

// UPDATE attachment (optionally upload new file)
export const updateAttachment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const updateData = {};

        if (name) updateData.name = name;

        // if new file uploaded, update file on Cloudinary
        if (req.files?.file) {
            const uploadResult = await uploadToCloudinary(req.files.file.tempFilePath);
            updateData.file = uploadResult.secure_url;
        }

        const updated = await LeadAttachement.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) return res.status(404).json({ message: "Not found" });

        return res.status(200).json({ status: true, data: updated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Server Error" });
    }
};

// DELETE attachment by id
export const deleteAttachment = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await LeadAttachement.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Not found" });
        return res.status(200).json({ status: true, message: "Deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Server Error" });
    }
};
