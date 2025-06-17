import { Router } from "express";
import { changePassword, login  } from "../controller/authController.js";
import { Enable2FA,Verify2fa } from "../controller/userController.js";

const router = Router();

router.post("/login", login);
router.post("/enable2fa", Enable2FA)
router.post("/verify2fa", Verify2fa)

router.post("/changePassword", changePassword);

export default router;
