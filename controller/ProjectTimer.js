import projectwork from "../models/ProjectWork.js";
import ProjectWork from "../models/ProjectWork.js"
import Clients from "../models/Tasks/Clients.js";
import Projects from "../models/Tasks/Projects.js";
import ProjectTasks from "../models/Tasks/task.js";
import User from "../models/User/User.js";

export const ProjectTimerCreate = async (req, res) => {
   try{

    const { taskId ,  Note , timeIn , timeOut , totalTime , user , projectId} = req.body;

      const projectDetails = await projectwork.create({taskId ,Note , timeIn , timeOut , totalTime , user , projectId});

      return res.status(200).json({
        status:true ,
        message:"successfuly" , 
        data: projectDetails
      })

   } catch(error){
    console.log(error);
    return res.status(500).json({
        status:false , 
        message:"Internal server error"
    })
   }
  }