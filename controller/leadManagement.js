import Lead from "../models/Lead/Lead.js";
import LeadTimeline from "../models/LeadTimeline.js";
import db from "../db/sql_conn.js"
import Deal from "../models/Deal.js"


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
            dynamicFields
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
            dynamicFields,
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
            status,
            dynamicFields
        } = req.body;

        // Ensure id is passed as a parameter
        const id = req.params.id;

        // Update lead details
        const leadDetail = await Lead.findByIdAndUpdate(
            id,
            {
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
                LinkedIn,
                Country,
                DescriptionInfo,
                date,
                status,
                dynamicFields
            },
            { new: true }
        );

        const timeline = await LeadTimeline.create({
            leadId: id,
            action: "Lead Edited",
            createdBy: req.user?.fullName || "System"
        });
        console.log(timeline._id)

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
};

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
            dealName, amount, closingDate, stage, campaignSource, contactRole, userId, organizationId
        } = req.body;

        // const { id: userId, organizationId } = req.user;
        const { leadId } = req.params;

        // 1. Validate Lead
        const lead = await Lead.findById(leadId);
        if (!lead) {
            return res.status(404).json({ status: false, message: "Lead not found" });
        }

        // 2. Create Deal
        const newDeal = await Deal.create({
            dealName,
            amount,
            closingDate,
            stage,
            campaignSource,
            contactRole,
            leadId,
            organizationId,
            createdBy: userId
        });

        // 3. Update Lead (optional fields)
        lead.status = "Converted";
        lead.closeDate = closingDate;
        lead.save();

        // 4. Push to Lead Timeline (optional)
        const timeline = await LeadTimeline.create({
            leadId: leadId,
            action: "Converted To Deal",
            createdBy: req.user?.fullName || "System"
        });
        console.log(timeline._id)

        return res.status(201).json({
            status: true,
            message: "Lead converted to deal successfully",
            data: newDeal
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: false, message: "Server Error", error: err.message });
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