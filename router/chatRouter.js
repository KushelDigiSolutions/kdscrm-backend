import { Router } from "express";
import {
  getChats,
  getAllChats,
  createNewChat,
  postMessage,
  deleteChat,
  deleteChats,
  getChat,
  getChatByUser,
} from "../controller/chatController.js";
import isAuthenticated from "../middleware/auth.js";



const router = Router();

router.get("/getChats", isAuthenticated, getChats);

router.get("/getChat/:id", isAuthenticated, getChat);

router.get("/getChatByUser", isAuthenticated, getChatByUser);

router.get("/getAllChats", getAllChats);

router.post("/createNewChat", isAuthenticated, createNewChat);

router.put("/postMessage/:id", isAuthenticated, postMessage);

router.delete("/deleteChat/:id", isAuthenticated, deleteChat);

router.delete("/deleteChats", deleteChats);

export default router;
