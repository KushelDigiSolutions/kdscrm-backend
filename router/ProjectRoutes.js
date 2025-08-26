// this is final project routes 
import { Router } from "express";
import {
    CreateProject, EditProject, deleteProject, createTask, editTask, deleteTask, getAllProjects, getProjectsByUserId, getTasksByProjectId, getUserTasksByProject, changeProjectStatus,
    changeTaskStatus, createTaskTimer, getUserTaskTimer, getTotalTaskTime, getClientTimeline, getSpecificProjectTimeline, getSpecificClientTimeline, getProjectTimeline, getClientProjectResources, getProjectTaskTimelines, uploadProjectFile, getProjectFiles, deleteProjectFile, getProjectsByClientId, createNote, getNotesByProject, deleteNote, updateNote
} from "../controller/ProjectFinal/ProjectApis.js"
import isAuthenticated from "../middleware/auth.js";


const router = Router();

router.post("/createProject", isAuthenticated, CreateProject);
router.get("/getAllProject", isAuthenticated, getAllProjects);
router.post("/editProject", isAuthenticated, EditProject);
router.delete("/deleteProject/:id", isAuthenticated, deleteProject);
router.get("/getTasksByProjectId/:projectId",  getTasksByProjectId);
router.post("/createTask", isAuthenticated, createTask);
router.delete("/deleteTask/:taskId", isAuthenticated, deleteTask);
router.post("/editTask", isAuthenticated, editTask);
router.post("/uploadProjectFile", uploadProjectFile);
router.post("/getProjectFiles/:projectId", getProjectFiles);
router.get("/getProjectsByUserId/:userId", getProjectsByUserId);
router.get("/getProjectsByClientId/:clientId", getProjectsByClientId);
router.get("/getClientProjectResources/:clientId", getClientProjectResources)
router.get("/getUserTasksByProject/:userId/:projectId", getUserTasksByProject);
router.post("/changeTaskStatus", changeTaskStatus);
router.post("/createTaskTimer", isAuthenticated, createTaskTimer);
router.get("/getUserTaskTimer", isAuthenticated, getUserTaskTimer);

router.get("/getProjectTaskTimelines/:projectId", getProjectTaskTimelines);
router.delete("/deleteProjectFile/:fileId", deleteProjectFile)
router.post('/createNote', createNote);
router.get('/getNotesByProject/:projectId', getNotesByProject);
router.put('/updateNote/:id', isAuthenticated, updateNote);
router.delete('/deleteNote/:id', isAuthenticated, deleteNote);

router.get("/getClientTimeline", isAuthenticated, getClientTimeline);
router.get("/client-timeline/:clientId", isAuthenticated, getSpecificClientTimeline);
router.get("/getProjectTimeline", isAuthenticated, getProjectTimeline);
router.get("/project-timeline/:projectId", isAuthenticated, getSpecificProjectTimeline);

export default router;