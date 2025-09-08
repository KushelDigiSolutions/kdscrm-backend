import { Router } from "express"
import {
    createLead, getLead, getAllLeads, editLead, getLeadTimeline, convertLeadToDeal, GetAllDeals, getDeal, createExternalLead, updateLeadStatus, createTimeLineNote, handleInstalledMetaWebhook,
    getTimelineNotes,
    updateTimelineNote,
    deleteTimelineNote, editDeal,
    createAccount, updateAccount, getAllAccounts, getAccount, accountToDeal, deleteAccount, handleGoogleLeadWebhook, googleLeadWebhook,
    createLeadAttachment,
    getAttachmentsByLeadId,
    getAttachmentById,
    updateAttachment,
    deleteAttachment,
    addUsersToLeads
} from "../controller/leadManagement.js"
import isAuthenticated from "../middleware/auth.js"

const router = Router();


router.post("/postLead", isAuthenticated, createLead);
router.post("/addUsersToLeads", isAuthenticated, addUsersToLeads);
router.get("/getLead/:id", getLead);
router.get("/allLeads", isAuthenticated, getAllLeads);
router.post("/updateLead/:id", isAuthenticated, editLead);
router.get("/getLeadTimeline/:id", getLeadTimeline);
router.post('/updateleadtatus/:id', updateLeadStatus)
router.post("/convert/:leadId", isAuthenticated, convertLeadToDeal);
router.post("/accountToDeal", isAuthenticated, accountToDeal);
router.get("/GetAllDeals", isAuthenticated, GetAllDeals);
router.get("/getDeal/:id", getDeal);
router.post("/createExternalLead", createExternalLead)
router.post("/updateDeal/:id", isAuthenticated, editDeal);


router.post('/timeline/:timelineId/note', createTimeLineNote);
router.get('/timeline/:timelineId/notes', getTimelineNotes);
router.put('/timeline/:timelineId/note/:noteIndex', updateTimelineNote);
router.delete('/timeline/:timelineId/note/:noteIndex', deleteTimelineNote);

router.post("/createAccount", isAuthenticated, createAccount);
router.put("/updateAccount/:id", updateAccount);
router.get("/getAllAccounts", isAuthenticated, getAllAccounts);
router.get("/getAccount/:id", isAuthenticated, getAccount);
router.delete("/deleteAccount/:id", deleteAccount)



// Mount as: /meta/installed-webhook/:orgId
router.get("/meta/installed-webhook/:orgId", handleInstalledMetaWebhook);
router.post("/meta/installed-webhook/:orgId", handleInstalledMetaWebhook);


router.post("/google/installed-webhook/:orgId", handleGoogleLeadWebhook);


router.post('/google-leads/webhook', googleLeadWebhook);




router.post("/createLeadAttachment", createLeadAttachment);

// Get all attachments of a lead
router.get("/getAttachmentsByLeadId/:leadId", getAttachmentsByLeadId);

// Get one attachment
router.get("/getAttachmentById/:id", getAttachmentById);

// Update
router.put("/updateAttachment/:id", updateAttachment);

// Delete
router.delete("/deleteAttachment/:id", deleteAttachment);


export default router;