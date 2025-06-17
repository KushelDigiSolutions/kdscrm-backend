import { Router } from "express";
import isAuthenticated from "../middleware/auth.js";
import { upload } from "../middleware/multer.js";
import {
  deleteAllAnnouncements,
  deleteAnnouncement,
  getAnnouncementDates,
  getAnnouncements,
  postAnnouncement,
  updateAnnouncement,
} from "../controller/announcementController.js";

const router = Router();



router.post(
  "/postAnnouncement",
  isAuthenticated,
  upload.single("image"),
  postAnnouncement
);

router.put(
  "/updateAnnouncement/:id",
  isAuthenticated,
  upload.single("image"),
  updateAnnouncement
);

router.get("/getAnnouncements", isAuthenticated, getAnnouncements);

router.get("/getAnnouncementDates", isAuthenticated, getAnnouncementDates);

router.delete("/deleteAnnouncement/:id", isAuthenticated, deleteAnnouncement);

router.delete("/deleteAllAnnouncements", deleteAllAnnouncements);

export default router;
