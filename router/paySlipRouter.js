import { Router } from "express";
import {getPayslip , togglePayslip , bulkPayslip , SetUserTotalLeave} from "../controller/payslipController.js"

const router = Router();

router.post("/getPlayslip" , getPayslip);
router.post("/toglePayslip/:userId" , togglePayslip);
router.post("/bulkPayslip" , bulkPayslip);
router.post("/setUserTotalLeave" , SetUserTotalLeave);


export default router;
