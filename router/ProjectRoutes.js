// this is final project routes 
import { Router } from "express";
import {
    CreateProject, EditProject, deleteProject, createTask, editTask, deleteTask, getAllProjects, getProjectsByUserId, getTasksByProjectId, getUserTasksByProject, changeProjectStatus, changeTaskStatus, createTaskTimer, getTotalTaskTime, getProjectTaskTimelines, uploadProjectFile, getProjectFiles, deleteProjectFile, getProjectsByClientId
} from "../controller/ProjectFinal/ProjectApis.js"
import isAuthenticated from "../middleware/auth.js";


const router = Router();

router.post("/createProject", isAuthenticated, CreateProject);
router.get("/getAllProject", isAuthenticated, getAllProjects);
router.post("/editProject", EditProject);
router.delete("/deleteProject/:id", deleteProject);
router.get("/getTasksByProjectId/:projectId", getTasksByProjectId);
router.post("/createTask", createTask);
router.delete("/deleteTask/:taskId", deleteTask);
router.post("/editTask", editTask);
router.post("/uploadProjectFile", uploadProjectFile);
router.post("/getProjectFiles/:projectId", getProjectFiles);
router.get("/getProjectsByUserId/:userId", getProjectsByUserId);
router.get("/getProjectsByClientId/:clientId", getProjectsByClientId);
router.get("/getUserTasksByProject/:userId/:projectId", getUserTasksByProject);
router.post("/changeTaskStatus", changeTaskStatus);
router.post("/createTaskTimer", createTaskTimer);
router.get("/getProjectTaskTimelines/:projectId", getProjectTaskTimelines);
router.delete("/deleteProjectFile/:fileId", deleteProjectFile)



export default router;