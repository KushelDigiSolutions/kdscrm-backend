import { Router } from "express";
import {createNotification , getNotification , deleteNotification , getNotificationHR, markedNotification } from "../controller/notification.js"
import {clientNotification, getClientNotification} from "../controller/Clients.js"

const router = Router();

router.post('/createNotification',createNotification);
router.get('/getNotification/:userId',getNotification);
router.get('/getNotification',getNotificationHR);
router.delete('/deleteNotification/:userId/:notId',deleteNotification);
router.put('/markedNotification/:id', markedNotification);

router.post('/clientNotification',clientNotification);
router.get('/getClientNotification/:id',getClientNotification)

export default router;
