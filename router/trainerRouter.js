import { Router } from "express";
import { createTrainer,getTrainer,updateTrainer,deleteTrainer } from "../controller/trainerController";

const router = Router();

router.post('/createTrainer',createTrainer);
router.get('/getTrainer',getTrainer);

router.delete("/deleteTrainer/:id",deleteTrainer);
router.put("/updateTrainer/:id",updateTrainer);
