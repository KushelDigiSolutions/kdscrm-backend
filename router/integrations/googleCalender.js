import { Router } from "express";

// import isAuthenticated from "../../middleware/auth";
import {
  authSetup,
    authRedirect,
    fetchCalendarEvents,
    createCalendarEvent,
    deleteCalendarEvent, testCalendarAccess
} from "../../controller/interegations/googleCalender.js"; 

// const router = Router();

const router = Router();

router.get('/api/auth/google', authSetup);
router.get('/api/auth/google/callback', authRedirect);

// Calendar routes
// Add to your routes file
router.post('/calendar/test-access', testCalendarAccess);
router.post('/calendar/events', fetchCalendarEvents);
router.post('/calendar/create-event', createCalendarEvent);
router.delete('/calendar/delete-event/:id', deleteCalendarEvent);


export default router;