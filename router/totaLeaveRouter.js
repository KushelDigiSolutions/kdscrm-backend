import { Router } from "express";
import {
  postTotalLeaves,
  getTotalLeaves,
  getAllTotalLeaves,
} from "../controller/totalLeaveController.js";
import isAuthenticated from "../middleware/auth.js";

const router = Router();

router.post("/postTotalLeaves", isAuthenticated, async (req, res) => {
  try {
    const data = await postTotalLeaves({ ...req.body, auth: req.user });
    if (data.success) {
      res.json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/getTotalLeaves", isAuthenticated, getTotalLeaves);

// Set admin auth
router.get("/getAllTotalLeaves", isAuthenticated, getAllTotalLeaves);

export default router;
