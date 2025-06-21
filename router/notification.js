import { Router } from "express";
import { createNotification, getNotification, deleteNotification, getNotificationHR, markedNotification } from "../controller/notification.js"
import { clientNotification, getClientNotification } from "../controller/Clients.js"
import isAuthenticated from "../middleware/auth.js";

const router = Router();

router.post('/createNotification', isAuthenticated, createNotification);
router.get('/getNotification/:userId', isAuthenticated, getNotification);
router.get('/getNotification', isAuthenticated, getNotificationHR);
router.delete('/deleteNotification/:userId/:notId', deleteNotification);
router.put('/markedNotification/:id', isAuthenticated, markedNotification);

router.post('/clientNotification', clientNotification);
router.get('/getClientNotification/:id', getClientNotification)

export default router;
