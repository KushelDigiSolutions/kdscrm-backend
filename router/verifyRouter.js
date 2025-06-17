import { Router } from "express";
import { verifyUser } from "../controller/verifyController.js";
import isAuthenticated from "../middleware/auth.js";

const router = Router();

router.post("/", isAuthenticated, async (req, res) => {
  try {
    const data = await verifyUser({ ...req.body, auth: req.user });
    if (data.success) {
      res.json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    console.log(error);
  }
});

export default router;
