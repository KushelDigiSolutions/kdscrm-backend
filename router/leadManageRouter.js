import { Router } from "express"
import { createLead, getLead, getAllLeads, editLead, getLeadTimeline } from "../controller/leadManagement.js"
import isAuthenticated from "../middleware/auth.js"

const router = Router();


router.post("/postLead", isAuthenticated, createLead);
router.get("/getLead/:id", getLead);
router.get("/allLeads", isAuthenticated, getAllLeads);
router.post("/updateLead/:id", isAuthenticated, editLead);
router.get("/getLeadTimeline/:id", getLeadTimeline);

export default router;