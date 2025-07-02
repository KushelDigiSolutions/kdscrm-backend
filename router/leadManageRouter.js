import { Router } from "express"
import { createLead, getLead, getAllLeads, editLead, getLeadTimeline, convertLeadToDeal, GetAllDeals, getDeal, createExternalLead } from "../controller/leadManagement.js"
import isAuthenticated from "../middleware/auth.js"

const router = Router();


router.post("/postLead", isAuthenticated, createLead);
router.get("/getLead/:id", getLead);
router.get("/allLeads", isAuthenticated, getAllLeads);
router.post("/updateLead/:id", isAuthenticated, editLead);
router.get("/getLeadTimeline/:id", getLeadTimeline);
router.post("/convert/:leadId", convertLeadToDeal);
router.get("/GetAllDeals", isAuthenticated, GetAllDeals);
router.get("/getDeal/:id", getDeal);
router.post("/createExternalLead", createExternalLead)

export default router;