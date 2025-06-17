import { Router } from "express";
import {
  postProject,
  getProjects,
  getAllProjects,
  deleteAllProjects,
  updateProject,
  getProjectsByEmployee,
  getProjectsByAdmin,
  deleteProject,
} from "../controller/projectController.js";
import isAuthenticated from "../middleware/auth.js";
import { upload } from "../middleware/multer.js";

const router = Router();

router.post(
  "/postProject",
  isAuthenticated,
  upload.array("file", 5),
  postProject
);

router.get("/getProjects", isAuthenticated, getProjects);

router.get("/getProjectsByEmployee", isAuthenticated, getProjectsByEmployee);

router.get("/getProjectsByAdmin", isAuthenticated, getProjectsByAdmin);

router.put(
  "/updateProject/:id",
  isAuthenticated,
  upload.array("file", 5),
  updateProject
);

router.delete("/deleteProject/:id", isAuthenticated, deleteProject);

router.get("/getAllProjects", getAllProjects);

router.delete("/deleteAllProjects", deleteAllProjects);

export default router;
