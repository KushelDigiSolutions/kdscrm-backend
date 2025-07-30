import express from "express";
import {
    createIntegration,
    getAllIntegrations,
    getActiveIntegrations,
    getIntegrationById,
    updateIntegration,
    deleteIntegration,
    restoreIntegration,
    updateIntegrationLastUsed, sendMessage
} from "../../controller/interegations/whatsappInteregation.js";
import isAuthenticated from "../../middleware/auth.js";

const router = express.Router();

router.post("/setup", isAuthenticated, createIntegration);
router.get("/getAllWhatsapps", isAuthenticated, getAllIntegrations);
// Get only active integrations
router.get("/active", isAuthenticated, getActiveIntegrations);
router.get("/getAllWhatsapp/:id", isAuthenticated, getIntegrationById);
// Restore deactivated integration
router.patch("/:id/restore", isAuthenticated, restoreIntegration);
router.put("/updateIntegration/:id", isAuthenticated, updateIntegration);
// Update last used timestamp
router.patch("/:id/update-last-used", isAuthenticated, updateIntegrationLastUsed);

router.delete("/deleteIntegration/:id", isAuthenticated, deleteIntegration);


// send Message
router.post("/send", isAuthenticated, sendMessage)

export default router;
