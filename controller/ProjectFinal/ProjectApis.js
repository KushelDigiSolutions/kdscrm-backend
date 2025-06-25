import Project from "../../models/Tasks/Projects.js"
import ProjectTask from "../../models/Tasks/task.js"
import TaskTimer from "../../models/Tasks/TimerDetail.js";
import moment from "moment";
import { uploadToCloudinary } from "../../utils/cloudinary.js";
import ProjectFiles from "../../models/Tasks/ProjectFile.js";
import { mailSender } from "../../utils/SendMail2.js";
import User from "../../models/User/User.js"
import Clients from "../../models/Tasks/Clients.js";
import db from "../../db/sql_conn.js"
import task from "../../models/taskModel.js";



// Completed on Add Project page => adminDash/HRM/taskProjects
export const CreateProject = async (req, res) => {
  try {
    const { organizationId } = req.user
    const { projectName, projectOwner, Status, Members, startDate, deadline, Description, client } = req.body;

    // console.log("It is Running")
    if (!projectName || !Status || !Members || !startDate || !deadline) {
      return res.status(403).json({
        status: false,
        message: "Require all data"
      })
    }

    const clientDetail = await Clients.findById(client);
    // if (!clientDetail) {
    //   return res.status(404).json({
    //     status: false,
    //     message: 'Client not found',
    //   });
    // }
    Members.forEach(async (user) => {
      const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [user]);
      const userdetail = users[0]
      await mailSender(userdetail.email, `New Project`, `<div>
              <div>projectName: ${projectName}</div>
              <div>startDate: ${startDate}</div>
              <div>deadline: ${deadline}</div>
           
              </div>`);

    });

    const resp = await Project.create({ projectName, projectOwner, Status, Members, startDate, deadline, Description, client, organizationId });

    return res.status(200).json({
      status: true,
      message: "Successffuly crated",
      data: resp,
    })

  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      status: false,
      message: 'Internal server error '
    })
  }
}


// Completed on Add Project page => adminDash/HRM/taskProjects
export const EditProject = async (req, res) => {
  try {

    const { projectName, Status, Members, startDate, deadline, Description, projectId, projectOwner, client } = req.body;

    // if(!projectName   || !Status  || !Members || !startDate  || !deadline || !Description){
    //   return res.status(403).json({
    //       status:false ,
    //       message:"Require all data"
    //   })
    // }

    const resp = await Project.findByIdAndUpdate(projectId, { projectName, Status, Members, startDate, deadline, Description, projectOwner, client }, { new: true });

    return res.status(200).json({
      status: true,
      message: "Successffuly crated",
    })

  } catch (error) {
    // console.log("error", error);
    return res.status(500).json({
      status: false,
      message: 'Internal server error '
    })
  }
}

// Completed on Add Project page => adminDash/HRM/taskProjects
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Project ID is required",
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        status: false,
        message: "Project not found",
      });
    }

    await Project.findByIdAndDelete(id);

    return res.status(200).json({
      status: true,
      message: "Project deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting project:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};


export const createTask = async (req, res) => {
  try {
    const { taskName, startDate, dueDate, priority, Members, Project, Status, description, taskfile } = req.body;

    if (!taskName || !startDate || !dueDate || !Members || !Project, !description) {
      return res.status(400).json({
        status: false,
        message: "All fields are required",
      });
    }

    // Ensure Members is an array
    if (!Array.isArray(Members) || Members.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Members should be a non-empty array",
      });
    }

    const tasks = await ProjectTask.create({
      taskName,
      startDate,
      dueDate,
      taskfile,
      description,
      priority: priority || "Normal",
      Members,
      Project,
      Status: Status || "Not Started",
    });

    Members.forEach(async (user) => {
      const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [user]);
      const userdetail = users[0]
      await mailSender(userdetail.email, `New task`, `<div>
           <div>taskName: ${taskName}</div>
           <div>startDate: ${startDate}</div>
           <div>dueDate: ${dueDate}</div>
        
           </div>`);

    });


    return res.status(201).json({
      status: true,
      message: "Tasks created successfully",
      tasks,
    });

  } catch (error) {
    console.error("Error creating tasks:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const editTask = async (req, res) => {
  try {
    const { taskId, taskName, startDate, dueDate, priority, Members, Project, Status, description, taskfile } = req.body;

    if (!taskId) {
      return res.status(400).json({
        status: false,
        message: "Task ID is required",
      });
    }

    const updatedTask = await ProjectTask.findByIdAndUpdate(
      taskId,
      {
        taskName,
        startDate,
        dueDate,
        priority,
        Members,
        Project,
        taskfile,
        Status,
        description
      },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        status: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Task updated successfully",
      updatedTask,
    });

  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};


export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({
        status: false,
        message: "Task ID is required",
      });
    }

    const deletedTask = await ProjectTask.findByIdAndDelete(taskId);

    if (!deletedTask) {
      return res.status(404).json({
        status: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Task deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const getAllProjects = async (req, res) => {
  try {
    const { organizationId } = req.user;

    // 1. Fetch projects by org ID
    const projects = await Project.find({ organizationId });

    // 2. Collect all userIds from all project Members
    const allUserIds = [
      ...new Set(
        projects.flatMap(project => project.Members.map(id => id.toString()))
      )
    ];

    if (allUserIds.length === 0) {
      return res.status(200).json({
        status: true,
        message: "No projects found or no members in projects",
        projects: [],
      });
    }

    // 3. Fetch all corresponding users from SQL
    const [users] = await db.execute(
      `SELECT * FROM users WHERE id IN (${allUserIds.map(() => '?').join(',')})`,
      allUserIds
    );

    // 4. Create map of userId -> userDetails
    const userMap = {};
    users.forEach(user => {
      userMap[user.id.toString()] = user;
    });

    // 5. Attach enriched user data to each project's Members
    const enrichedProjects = projects.map(project => {
      return {
        ...project.toObject(),
        Members: project.Members.map(id => userMap[id.toString()] || id)  // fallback to raw ID if user not found
      };
    });

    return res.status(200).json({
      status: true,
      message: "Projects fetched successfully",
      projects: enrichedProjects,
    });

  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const getProjectsByClientId = async (req, res) => {
  try {
    const { clientId } = req.params;
    if (!clientId) {
      return res.status(400).json({
        status: false,
        message: "client ID is required",
      });
    }
    const projects = await Project.find({ client: clientId })
    return res.status(200).json({
      status: true,
      message: "Projects fetched successfully",
      projects,
    });

  } catch (error) {
    console.error("Error fetching projects by user:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
}

export const getProjectsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required",
      });
    }

    const projects = await Project.find({
      $or: [{ projectOwner: userId }, { Members: userId }],
    });

    // 2. Collect all userIds from all project Members
    const allUserIds = [
      ...new Set(
        projects.flatMap(project => project.Members.map(id => id.toString()))
      )
    ];
    console.log(allUserIds)

    if (allUserIds.length === 0) {
      return res.status(200).json({
        status: true,
        message: "No projects found or no members in projects",
        projects: [],
      });
    }
    // 3. Fetch all corresponding users from SQL
    const [users] = await db.execute(
      `SELECT * FROM users WHERE id IN (${allUserIds.map(() => '?').join(',')})`,
      allUserIds
    );

    // 4. Create map of userId -> userDetails
    const userMap = {};
    users.forEach(user => {
      userMap[user.id.toString()] = user;
    });
    // 5. Attach enriched user data to each project's Members
    const enrichedProjects = projects.map(project => {
      return {
        ...project.toObject(),
        Members: project.Members.map(id => userMap[id.toString()] || id)  // fallback to raw ID if user not found
      };
    });

    return res.status(200).json({
      status: true,
      message: "Projects fetched successfully",
      projects: enrichedProjects,
    });

  } catch (error) {
    console.error("Error fetching projects by user:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};


export const getTasksByProjectId = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        status: false,
        message: "Project ID is required",
      });
    }

    const tasks = await ProjectTask.find({ Project: projectId });
    // 2. Collect all userIds from all project Members
    const allUserIds = [
      ...new Set(
        tasks.flatMap(task => task.Members.map(id => id && id.toString()))
      )
    ];

    if (allUserIds.length === 0) {
      return res.status(200).json({
        status: true,
        message: "No projects found or no members in projects",
        projects: [],
      });
    }

    // 3. Fetch all corresponding users from SQL
    const [users] = await db.execute(
      `SELECT * FROM users WHERE id IN (${allUserIds.map(() => '?').join(',')})`,
      allUserIds
    );

    // 4. Create map of userId -> userDetails
    const userMap = {};
    users.forEach(user => {
      userMap[user.id.toString()] = user;
    });

    // 5. Attach enriched user data to each project's Members
    const enrichedTasks = tasks.map(task => {
      return {
        ...task.toObject(),
        Members: task.Members.map(id => userMap[id.toString()] || id)  // fallback to raw ID if user not found
      };
    });

    return res.status(200).json({
      status: true,
      message: "Tasks fetched successfully",
      tasks: enrichedTasks,
    });

  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const getUserTasksByProject = async (req, res) => {
  try {
    const { userId, projectId } = req.params;

    if (!userId || !projectId) {
      return res.status(400).json({
        status: false,
        message: "User ID and Project ID are required",
      });
    }

    const tasks = await ProjectTask.find({ Project: projectId, Members: userId }).populate("Members");

    return res.status(200).json({
      status: true,
      message: "User tasks fetched successfully",
      tasks,
    });

  } catch (error) {
    console.error("Error fetching user tasks:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const changeProjectStatus = async (req, res) => {
  try {
    const { projectId, status } = req.body;

    if (!projectId || !status) {
      return res.status(400).json({
        status: false,
        message: "Project ID and status are required",
      });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { Status: status },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({
        status: false,
        message: "Project not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Project status updated successfully",
      updatedProject,
    });

  } catch (error) {
    console.error("Error updating project status:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};



export const changeTaskStatus = async (req, res) => {
  try {
    const { taskId, status } = req.body;

    if (!taskId || !status) {
      return res.status(400).json({
        status: false,
        message: "Task ID and status are required",
      });
    }

    const updatedTask = await ProjectTask.findByIdAndUpdate(
      taskId,
      { Status: status },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        status: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Task status updated successfully",
      updatedTask,
    });

  } catch (error) {
    console.error("Error updating task status:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const createTaskTimer = async (req, res) => {
  try {
    const { taskId, clockIn, clockOut, totalTime, projectId, submitedBy, Note } = req.body;

    if (!taskId || !clockIn || !clockOut || !totalTime || !submitedBy || !Note) {
      return res.status(400).json({
        status: false,
        message: "Task ID, Clock In, and Clock Out times are required",
      });
    }

    const timerEntry = await TaskTimer.create({ taskId, clockIn, clockOut, totalTime, projectId, submitedBy, Note });

    return res.status(201).json({
      status: true,
      message: "Task timer recorded successfully",
      timerEntry,
    });

  } catch (error) {
    console.error("Error creating task timer:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const getTotalTaskTime = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({
        status: false,
        message: "Task ID is required",
      });
    }

    const taskTimers = await TaskTimer.find({ taskId });


    let totalMinutes = 0;

    taskTimers.forEach(timer => {
      const startTime = moment(timer.clockIn, "HH:mm");
      const endTime = moment(timer.clockOut, "HH:mm");
      totalMinutes += endTime.diff(startTime, "minutes");
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return res.status(200).json({
      status: true,
      message: "Total time calculated successfully",
      totalTime: `${totalHours} Hr ${remainingMinutes} min`,
    });

  } catch (error) {
    console.error("Error fetching total task time:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};


export const getProjectTaskTimelines = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await ProjectTask.find({ Project: projectId });
    if (!tasks.length) {
      return res.status(404).json({
        status: false,
        message: "No tasks found for this project",
      });
    }

    const taskIds = tasks.map(task => task._id);

    const taskTimers = await TaskTimer.find({ taskId: { $in: taskIds } })
      .populate({
        path: "taskId",
        populate: {
          path: "Members",
          model: "User",
        },
      })
      .populate("submitedBy")
      .sort({ createdAt: -1 });

    const allUserIds = [
      ...new Set(
        taskTimers.flatMap(timer => {
          const memberIds = timer?.taskId?.Members?.map(m => m && m.toString()) || [];
          return [...memberIds, timer.submitedBy?.toString()];
        })
      )
    ];

    const [users] = await db.execute(
      `SELECT * FROM users WHERE id IN (${allUserIds.map(() => '?').join(',')})`,
      allUserIds
    );

    const userMap = {};
    users.forEach(user => {
      userMap[user.id.toString()] = user;
    });

    const enriched = taskTimers.map(timer => {
      const task = timer.taskId?.toObject?.() || timer.taskId;
      return {
        ...timer.toObject(),
        taskId: {
          ...task,
          Members: task?.Members?.map(id => userMap[id.toString()] || id) || []
        },
        submitedBy: userMap[timer.submitedBy?.toString()] || timer.submitedBy
      };
    });

    return res.status(200).json({
      status: true,
      message: "Task timelines fetched successfully",
      taskTimelines: enriched,
    });
  } catch (error) {
    console.error("Error fetching task timelines:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong while fetching task timelines",
      error: error.message
    });
  }
};


export const uploadProjectFile = async (req, res) => {
  try {
    const { projectId, uploadedBy } = req.body;
    console.log(projectId, uploadedBy)

    if (!projectId || !req.files || !uploadedBy) {
      return res.status(400).json({
        status: false,
        message: "Project ID, file, and uploader ID are required",
      });
    }

    console.log("req", req.files?.file);
    const fileLocalPath = req.files?.file?.tempFilePath;
    console.log("flie", fileLocalPath);
    if (!fileLocalPath) {
      return res.status(400).json({ status: false, message: "File path not found" });
    }

    const uploadedFile = await uploadToCloudinary(fileLocalPath);
    if (!uploadedFile || !uploadedFile.secure_url) {
      return res.status(500).json({ status: false, message: "File upload to Cloudinary failed" });
    }

    const newFile = new ProjectFiles({
      projectId,
      fileName: req.files.file.name,
      filePath: uploadedFile.secure_url,
      uploadedBy,
    });

    await newFile.save();

    return res.status(200).json({
      status: true,
      message: "File uploaded successfully",
      file: newFile,
    });

  } catch (error) {
    console.error("File Upload Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};


export const getProjectFiles = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({ status: false, message: "Project ID is required" });
    }

    const files = await ProjectFiles.find({ projectId }).populate("uploadedBy");

    return res.status(200).json({
      status: true,
      message: "Project files fetched successfully",
      files,
    });

  } catch (error) {
    console.error("Fetch Files Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};


export const deleteProjectFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    console.log(fileId)

    if (!fileId) {
      return res.status(400).json({ status: false, message: "File ID is required" });
    }

    const file = await ProjectFiles.findById(fileId);
    if (!file) {
      return res.status(404).json({ status: false, message: "File not found" });
    }

    await ProjectFiles.findByIdAndDelete(fileId);

    return res.status(200).json({
      status: true,
      message: "File deleted successfully",
    });

  } catch (error) {
    console.error("Delete File Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
