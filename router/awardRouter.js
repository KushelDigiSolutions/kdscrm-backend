import { Router } from "express";
import isAuthenticated from "../middleware/auth.js";
import { createAward, getAllAward, deleteAward, updateAward } from "../controller/awardController.js"

const router = Router();

router.post("/postAward", createAward);
router.get("/getAllAward", isAuthenticated, getAllAward);
router.delete("/deleteAward/:id", deleteAward);
router.put("/updateAward/:id", updateAward);

export default router;
