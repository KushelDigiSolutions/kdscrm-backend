import { Router } from "express";
import {
  login,
  createUser,
  getUsers,
  getHrs,
  deleteHrs,
  changePassword,
} from "../controller/hrController.js";
import isAuthenticated from "../middleware/auth.js";

const router = Router();

router.get("/getHrs", isAuthenticated, getHrs);

router.delete("/deleteHrs", isAuthenticated, deleteHrs);

router.post("/login", login);
router.post("/changePassword", isAuthenticated, changePassword);

// Create Employee
router.post("/createUser", isAuthenticated, createUser);

router.get("/getUsers", isAuthenticated, getUsers);

export default router;
