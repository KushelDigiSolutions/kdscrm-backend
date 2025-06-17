import { Router } from "express";
import {
  postHoliday,
  updateHoliday,
  getHolidays,
  deleteHoliday,
  getAllHolidays,
  deleteAllHolidays,
} from "../controller/holidayController.js";
import isAuthenticated from "../middleware/auth.js";


const router = Router();

router.post("/postHoliday", isAuthenticated, postHoliday);

router.put("/updateHoliday/:id", isAuthenticated, updateHoliday);

router.get("/getHolidays", isAuthenticated, getHolidays);

router.delete("/deleteHoliday/:id", isAuthenticated, deleteHoliday);

router.get("/getAllHolidays", getAllHolidays);

router.delete("/deleteAllHolidays", deleteAllHolidays);

export default router;
