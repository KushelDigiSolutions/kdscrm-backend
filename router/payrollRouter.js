import { Router } from "express";
import {getAllUserPayroll , editUserSalary , createAllowance , editAllowance , deleteAllowance , createCommission , editCommission , deleteCommission , createLoan , editLoan , deleteLoan} from "../controller/payrollController.js"

const router = Router();

router.get("/getAllUserPayroll/:id" , getAllUserPayroll);
router.post("/editUserSalary/:id" , editUserSalary);

// for allowance 
router.post("/createAllowance/:id" , createAllowance);
router.post("/editAllowance/:id" , editAllowance);
router.delete("/deleteAllowance/:allowanceId/:id" , deleteAllowance);

// for commision
router.post("/createCommission/:id" , createCommission);
router.post("/editCommission/:id" , editCommission);
router.delete("/deleteCommission/:allowanceId/:id" , deleteCommission);

// for loan 
router.post("/createLoan/:id" , createLoan);
router.post("/editLoan/:id" , editLoan);
router.delete("/deleteLoan/:allowanceId/:id" , deleteLoan);


export default router;
