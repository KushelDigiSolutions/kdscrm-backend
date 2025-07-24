import { Router } from "express"
import {
    createLead, getLead, getAllLeads, editLead, getLeadTimeline, convertLeadToDeal, GetAllDeals, getDeal, createExternalLead, updateLeadStatus, createTimeLineNote,
    getTimelineNotes,
    updateTimelineNote,
    deleteTimelineNote,
    createAccount, updateAccount, getAllAccounts, getAccount, accountToDeal, deleteAccount
} from "../controller/leadManagement.js"
import isAuthenticated from "../middleware/auth.js"

const router = Router();


router.post("/postLead", isAuthenticated, createLead);
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

router.post("/timeline/:id/note", createTimeLineNote);
router.get("/timeline/:id/notes", getTimelineNotes);
router.put("/timeline/:timelineId/note/:noteIndex", updateTimelineNote);
router.delete("/timeline/:timelineId/note/:noteIndex", deleteTimelineNote);

router.post("/createAccount", isAuthenticated, createAccount);
router.put("/updateAccount/:id", updateAccount);
router.get("/getAllAccounts", isAuthenticated, getAllAccounts);
router.get("/getAccount/:id", isAuthenticated, getAccount);
router.delete("/deleteAccount/:id", deleteAccount)

export default router;