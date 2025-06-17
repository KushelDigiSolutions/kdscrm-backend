import { Router } from "express";
import {
  getAttendance,
  getAttendanceByUser,
  
} from "../controller/attendanceController.js";
import isAuthenticated from "../middleware/auth.js";

const router = Router();

router.get("/getAttendance", isAuthenticated, getAttendance);

router.get("/getAttendanceByUser", isAuthenticated, getAttendanceByUser);

export default router;




