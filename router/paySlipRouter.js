import { Router } from "express";
import { getPayslip, togglePayslip, bulkPayslip, SetUserTotalLeave } from "../controller/payslipController.js"
import isAuthenticated from "../middleware/auth.js";

const router = Router();

router.post("/getPlayslip", isAuthenticated, getPayslip);
router.post("/toglePayslip/:userId", isAuthenticated, togglePayslip);
router.post("/bulkPayslip", isAuthenticated, bulkPayslip);
router.post("/setUserTotalLeave", isAuthenticated, SetUserTotalLeave);


export default router;
