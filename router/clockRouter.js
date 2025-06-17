import { Router } from "express";
import { createClock, getClockByUserDate, getAttendanceDetails, getAllAttendence, updateAttendance, deleteAttendence, SaveClockNote, getMonthlyWorkingHours } from "../controller/clockController.js"
import isAuthenticated from "../middleware/auth.js";
const router = Router();

router.post('/createClock/:userId', isAuthenticated, createClock);
router.post('/getClock/:userId', getClockByUserDate);
router.post('/savenoteatt/:userId', SaveClockNote);
router.post("/attendencedetail", getAttendanceDetails);
router.get("/allAttendence", isAuthenticated, getAllAttendence);
router.get('/getMonthlyWorkingHours', getMonthlyWorkingHours)
router.post("/updateAttendance/:id", updateAttendance);
router.delete("/deleteAttendence/:id", deleteAttendence);


export default router;
