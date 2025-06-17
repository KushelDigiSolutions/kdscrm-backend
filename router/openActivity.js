import { Router } from "express";
import { CreateTask, EditTask, DeleteTask, CreateMeet, EditMeet, DeleteMeet, GetTaskByUser, GetMeetByUser, FetchFollow, FetchAllTask } from "../controller/openActivity.js"
import isAuthenticated from "../middleware/auth.js";

const router = Router();

router.post("/createTask", isAuthenticated, CreateTask);
router.post("/editTask/:taskId", EditTask);
router.delete("/deleteTask/:taskId", DeleteTask);
router.get("/getTaskByUser/:userId", GetTaskByUser);

router.get("/fetchFollow/:id", FetchFollow);


router.post("/createMeet", isAuthenticated, CreateMeet);
router.post("/editMeet/:meetId", EditMeet);
router.delete("/deleteMeet/:meetId", DeleteMeet);
router.get("/getMeetByUser/:userId", GetMeetByUser);
router.get("/fetchTasksAll", FetchAllTask);


export default router;
