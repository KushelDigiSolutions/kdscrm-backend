import { Router } from "express";

import isAuthenticated from "../middleware/auth.js";
import {
  deleteTask,
  getTasks,
  postTask,
  updateTask,

} from "../controller/TaskController.js";

import { CreateClient, EditClient, clientLogin, getProjectTask, getMyProjectTask, getUpcomingBirthdays, getAllClient, getTaskByUserProject, DisableClient, DeleteClient, CreateProject, EditProject, changeTaskStatus, getAllProject, delteTaskId, DeleteProjects, getProjectByUser, CreateProjectTask, EditProjectTask, GetAllTask, GetTaskByUser, getTodayBirthday, FetchAllTask, getClient } from "../controller/Clients.js";


import { ProjectTimerCreate } from "../controller/ProjectTimer.js"

const router = Router();

router.post("/postTask", isAuthenticated, postTask);

router.put("/updateTask/:id", isAuthenticated, updateTask);

router.get("/getTasks", isAuthenticated, getTasks);
router.get("/FetchAllTask", FetchAllTask);

router.delete("/deleteTask/:id", isAuthenticated, deleteTask);

router.delete("/deleteProjectTaskapi/:id", delteTaskId);


// for cliient 
router.post("/createClient", isAuthenticated, CreateClient);
router.post("/clientLogin", clientLogin);

router.post("/editClient/:clientId", isAuthenticated, EditClient);
router.get("/getAllClient", isAuthenticated, getAllClient);
router.get("/getClient/:id", getClient);

router.post("/disableClient/:clientId", isAuthenticated, DisableClient);
router.delete("/deleteClient/:clientId", isAuthenticated, DeleteClient);

// for projeccts 

router.post("/createProject", CreateProject);
router.post("/editProject/:projectId", EditProject);
router.get("/getAllProject", isAuthenticated, getAllProject);
router.delete("/deleteProject/:projectId", DeleteProjects);
router.get("/getProjectByUser/:userId", getProjectByUser);


// for project task 
router.post("/createProjectTask/:projectId", isAuthenticated, CreateProjectTask);
router.post("/editProjectTask/:projectId/:taskId", isAuthenticated, EditProjectTask);
router.post("/changeTaskStatus/:taskId", changeTaskStatus);
router.get("/getAllTask", GetAllTask);
router.get("/getTaskByUser/:userId", GetTaskByUser);
router.get("/getTaskByUserProject/:userId/:projectId", getTaskByUserProject);
router.get("/getProjectTask/:projectId", getProjectTask);
router.get("/getMyProjectTask/:projectId/:memberId", getMyProjectTask);

// task timer apis 
router.post("/postProjectTimer", ProjectTimerCreate);


// user get birthday 
router.get("/getBirthDayUser", getTodayBirthday);
router.get("/getUpcomingBirthdays", isAuthenticated, getUpcomingBirthdays);




export default router;
