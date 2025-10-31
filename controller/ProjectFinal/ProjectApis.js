import Project from "../../models/Tasks/Projects.js"
import ProjectModel from "../../models/Tasks/Projects.js";
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
import Notes from "../../models/Notes.js"
import Timeline from "../../models/Tasks/ProjectTimeLine.js";
import Ticket from "../../models/Ticket.js";
// import { act } from "react";



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
      await mailSender(organizationId, userdetail.email, `New Project`, `<div>
              <div>projectName: ${projectName}</div>
              <div>startDate: ${startDate}</div>
              <div>deadline: ${deadline}</div>
           
              </div>`);

    });

    const resp = await Project.create({ projectName, projectOwner, Status, Members, startDate, deadline, Description, client, organizationId });
    await Timeline.create({
      entityType: "Project",
      entityId: resp._id,
      entityTypeRef: "Projects",
      action: "Created",
      performedBy: req.user.id,
      organizationId: req.user.organizationId,
    });

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
    await Timeline.create({
      entityType: "Project",
      entityId: resp._id,
      entityTypeRef: "Projects",
      action: "Updated",
      performedBy: req.user.id,
      organizationId: req.user.organizationId,
    });

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
    console.log(project);

    if (!project) {
      return res.status(404).json({
        status: false,
        message: "Project not found",
      });
    }


    await Timeline.create({
      entityType: "Project",
      entityId: project._id,
      entityTypeRef: "Projects",
      action: "Deleted",
      performedBy: req.user.id,
      organizationId: req.user.organizationId,
      deletedDataName: project.projectName,
    });
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
    const { organizationId, id: performedBy } = req.user;

    // Fix validation (no comma operator)
    if (!taskName || !startDate || !dueDate || !Members || !Project || !description) {
      return res.status(400).json({
        status: false,
        message: "All fields are required",
      });
    }

    // Ensure Members is array
    if (!Array.isArray(Members) || Members.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Members should be a non-empty array",
      });
    }

    // Get project detail (only projectName needed)
    const projectDetail = await ProjectModel.findById(Project).select("projectName");

    if (!projectDetail) {
      return res.status(404).json({
        status: false,
        message: "Project not found",
      });
    }

    // Create Task
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

    // Timeline entry (non-blocking with email)
    const timelineTask = Timeline.create({
      entityType: "Project",
      entityId: Project,
      entityTypeRef: "Projects",
      action: "Created",
      performedBy: req.user.id,
      organizationId,
      description: `Task "${taskName}" created in project "${projectDetail.projectName}"`,
    });

    // Get all users in one query instead of loop
    const [userRows] = await db.execute(
      `SELECT id, email, fullName FROM users WHERE id IN (${Members.map(() => "?").join(",")})`,
      Members
    );

    // Prepare all emails
    const emailTasks = userRows.map((userdetail) =>
      mailSender(
        organizationId,
        userdetail.email,
        `New Task Assigned`,
        `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">📋 New Task Assigned</h2>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 16px; margin-bottom: 10px;">Hello <strong>${userdetail.fullName || "User"}</strong>,</p>
            <p style="font-size: 15px; margin-bottom: 20px;">You have been assigned a new task:</p>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9;">Task Name:</td>
                <td style="padding: 10px;">${taskName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9;">Start Date:</td>
                <td style="padding: 10px;">${startDate}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9;">Due Date:</td>
                <td style="padding: 10px;">${dueDate}</td>
              </tr>
            </table>

            <p style="font-size: 15px; margin-top: 20px;">Please complete it within the due date.</p>

            <div style="margin-top: 30px; text-align: center;">
              <a href="https://hrms.kusheldigi.com" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to HRMS</a>
            </div>
          </div>
          <div style="background-color: #f0f0f0; padding: 10px; text-align: center; font-size: 12px; color: #666;">
            © ${new Date().getFullYear()} Kushel Digi HRMS
          </div>
        </div>
        `
      )
    );

    // Run timeline + emails in parallel (non-blocking)
    Promise.allSettled([timelineTask, ...emailTasks]).catch((err) =>
      console.error("Post-task operations failed:", err)
    );

    // Send response fast
    return res.status(201).json({
      status: true,
      message: "Task created successfully",
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
    const {
      taskId,
      taskName,
      startDate,
      dueDate,
      priority,
      Members,
      Project,
      Status,
      description,
      taskfile,
    } = req.body;

    const { organizationId, id: performedBy } = req.user;

    if (!taskId) {
      return res.status(400).json({
        status: false,
        message: "Task ID is required",
      });
    }

    // Fetch existing task (to compare old vs new members)
    const existingTask = await ProjectTask.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({
        status: false,
        message: "Task not found",
      });
    }

    const oldMembers = existingTask.Members || [];
    const newMembers = Members || [];

    // Find added members (for email notification)
    const addedMembers = newMembers.filter((id) => !oldMembers.includes(id));

    // Update the task
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
        description,
      },
      { new: true }
    ).populate("Project", "projectName");

    if (!updatedTask) {
      return res.status(404).json({
        status: false,
        message: "Task not found after update",
      });
    }

    // Add timeline entry (non-blocking)
    const timelineTask = Timeline.create({
      entityType: "Project",
      entityId: Project,
      entityTypeRef: "Projects",
      action: "Updated",
      performedBy,
      organizationId,
      description: `Task "${taskName}" updated in project "${updatedTask.Project?.projectName}"`,
    });

    // If new members added → fetch details in one query
    let emailTasks = [];
    if (addedMembers.length > 0) {
      const [userRows] = await db.execute(
        `SELECT id, email, fullName FROM users WHERE id IN (${addedMembers
          .map(() => "?")
          .join(",")})`,
        addedMembers
      );

      emailTasks = userRows.map((userdetail) =>
        mailSender(
          organizationId,
          userdetail.email,
          `New Task Assigned`,
          `
          <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
              <h2 style="margin: 0;">📋 New Task Assigned</h2>
            </div>
            <div style="padding: 20px;">
              <p style="font-size: 16px; margin-bottom: 10px;">Hello <strong>${userdetail.fullName || "User"}</strong>,</p>
              <p style="font-size: 15px; margin-bottom: 20px;">You have been assigned a new task:</p>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9;">Task Name:</td>
                  <td style="padding: 10px;">${taskName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9;">Start Date:</td>
                  <td style="padding: 10px;">${startDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold; background-color: #f9f9f9;">Due Date:</td>
                  <td style="padding: 10px;">${dueDate}</td>
                </tr>
              </table>

              <p style="font-size: 15px; margin-top: 20px;">Please complete it within the due date.</p>

              <div style="margin-top: 30px; text-align: center;">
                <a href="https://hrms.kusheldigi.com" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to HRMS</a>
              </div>
            </div>
            <div style="background-color: #f0f0f0; padding: 10px; text-align: center; font-size: 12px; color: #666;">
              © ${new Date().getFullYear()} Kushel Digi HRMS
            </div>
          </div>
          `
        )
      );
    }

    // Run timeline + email in background (non-blocking)
    Promise.allSettled([timelineTask, ...emailTasks]).catch((err) =>
      console.error("Post-task operations failed:", err)
    );

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
    const projectDetail = await ProjectTask.findById(taskId);

    // Pehle task ko find aur delete karo
    const deletedTask = await ProjectTask.findByIdAndDelete(taskId);

    if (!deletedTask) {
      return res.status(404).json({
        status: false,
        message: "Task not found",
      });
    }

    // Timeline entry banani hai to pehle deletedTask available hona chahiye
    await Timeline.create({
      entityType: "Project",
      entityId: projectDetail ? projectDetail._id : null,
      entityTypeRef: "Projects",
      action: "Deleted",
      performedBy: req.user.id,
      organizationId: req.user.organizationId,
      deletedDataName: deletedTask.taskName,
    });

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
    console.error("Error fetching projects by user:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
}

export const getClientProjectResources = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        status: false,
        message: "Client ID is required",
      });
    }

    // 1. Get all client projects
    const projects = await Project.find({ client: clientId });
    if (!projects.length) {
      return res.status(200).json({
        status: true,
        message: "No projects found for this client",
        tasks: [],
        notes: [],
        files: [],
      });
    }

    const projectIds = projects.map(p => p._id);

    // 2. Get all tasks for the projects
    const allTasks = await ProjectTask.find({ Project: { $in: projectIds } });

    // 3. Collect all unique user IDs from Members
    const allUserIds = [
      ...new Set(
        allTasks.flatMap(task => task.Members.map(id => id.toString()))
      ),
    ];

    // 4. Get SQL user info
    const [users] = allUserIds.length
      ? await db.execute(
        `SELECT * FROM users WHERE id IN (${allUserIds.map(() => '?').join(',')})`,
        allUserIds
      )
      : [[]];

    const userMap = {};
    users.forEach(user => {
      userMap[user.id.toString()] = user;
    });

    // 5. Enrich tasks with member details
    const enrichedTasks = allTasks.map(task => ({
      ...task.toObject(),
      Members: task.Members.map(id => userMap[id.toString()] || id),
    }));

    // 6. Get all notes and files for the projects
    const notes = await Notes.find({ project: { $in: projectIds } }).sort({ dateAdded: -1 });
    const files = await ProjectFiles.find({ projectId: { $in: projectIds } });

    const timelines = await Timeline.find({
      entityType: "Project",
      entityId: { $in: projectIds },
    })
      .populate("entityId")
      .sort({ createdAt: -1 })
      .lean();

    // Collect performedBy userIds from timelines
    const timelineUserIds = timelines
      .map((t) => t.performedBy?.toString())
      .filter(Boolean);

    let timelineUserMap = {};
    if (timelineUserIds.length) {
      const [timelineUsers] = await db.execute(
        `SELECT * FROM users WHERE id IN (${timelineUserIds
          .map(() => "?")
          .join(",")})`,
        timelineUserIds
      );

      timelineUsers.forEach((u) => {
        timelineUserMap[u.id.toString()] = `${u.fullName}`;
      });
    }

    const enrichedTimelines = timelines.map((t) => ({
      ...t,
      performedByName: timelineUserMap[t.performedBy?.toString()] || "Unknown User",
    }));

    // 7. Return final response
    return res.status(200).json({
      status: true,
      message: "Client project resources fetched successfully",
      tasks: enrichedTasks,
      notes,
      files,
      timelines: enrichedTimelines,
    });

  } catch (error) {
    console.error("Error in getClientProjectsTask:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};






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

    // 1. Fetch tasks by project and user
    const tasks = await ProjectTask.find({ Project: projectId, Members: userId });

    if (!tasks || tasks.length === 0) {
      return res.status(200).json({
        status: true,
        message: "No tasks found for this user in the project",
        tasks: [],
      });
    }

    // 2. Collect all Member IDs across tasks
    const allUserIds = [
      ...new Set(tasks.flatMap(task => task.Members.map(id => id.toString())))
    ];

    // 3. Fetch corresponding users from SQL
    const [users] = await db.execute(
      `SELECT * FROM users WHERE id IN (${allUserIds.map(() => '?').join(',')})`,
      allUserIds
    );

    // 4. Map userId -> user details
    const userMap = {};
    users.forEach(user => {
      userMap[user.id.toString()] = user;
    });

    // 5. Attach enriched user data to each task's Members
    const enrichedTasks = tasks.map(task => ({
      ...task.toObject(),
      Members: task.Members.map(id => userMap[id.toString()] || id) // fallback to raw ID
    }));

    return res.status(200).json({
      status: true,
      message: "User tasks fetched successfully",
      tasks: enrichedTasks,
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

// export const createTaskTimer = async (req, res) => {
//   try {
//     const { taskId, clockIn, clockOut, totalTime, projectId, submitedBy, Note } = req.body;

//     if (!taskId || !clockIn || !clockOut || !totalTime || !submitedBy || !Note) {
//       return res.status(400).json({
//         status: false,
//         message: "Task ID, Clock In, and Clock Out times are required",
//       });
//     }

//     const timerEntry = await TaskTimer.create({ taskId, clockIn, clockOut, totalTime, projectId, submitedBy, Note });

//     return res.status(201).json({
//       status: true,
//       message: "Task timer recorded successfully",
//       timerEntry,
//     });

//   } catch (error) {
//     console.error("Error creating task timer:", error);
//     return res.status(500).json({
//       status: false,
//       message: "Internal server error",
//     });
//   }
// };

export const createTaskTimer = async (req, res) => {
  try {
    const { taskId, projectId, Note, action } = req.body;
    const submitedBy = req.user.id;
    console.log(taskId, projectId, Note, action, submitedBy)

    if (!taskId || !submitedBy || !action) {
      return res.status(400).json({
        status: false,
        message: "Task ID, submittedBy, and action are required",
      });
    }

    const now = new Date();

    // Find the most recent timer for this task and user
    const existingTimer = await TaskTimer.findOne({
      taskId,
      submitedBy,
    }).sort({ createdAt: -1 });

    // ========== START ==========
    // ========== START ==========
    if (action === "start") {
      // Check if for this user there's already an active timer on any task
      const activeTimer = await TaskTimer.findOne({
        submitedBy,
        status: { $in: ["running", "paused"] }
      });

      if (activeTimer) {
        return res.status(400).json({
          status: false,
          message: "End current timer before starting a new one, please.",
        });
      }


      const newTimer = await TaskTimer.create({
        taskId,
        projectId,
        submitedBy,
        Note: Note,
        clockIn: now,
        totalTime: 0,
        status: "running",
        date: now,
      });

      return res.status(201).json({
        status: true,
        message: "Timer started successfully",
        timer: newTimer,
      });
    }




    // ========== PAUSE =========
    if (action === "pause") {
      if (!existingTimer || existingTimer.status !== "running") {
        return res.status(400).json({
          status: false,
          message: "No running timer found to pause.",
        });
      }
      const elapsed = now.getTime() - new Date(existingTimer.clockIn).getTime();
      existingTimer.clockOut = now;
      existingTimer.totalTime += elapsed;
      existingTimer.status = "paused";
      await existingTimer.save();

      return res.json({
        status: true,
        message: "Timer paused successfully",
        timer: existingTimer,
      });
    }

    // ========== RESUME =========
    if (action === "resume") {
      if (!existingTimer || existingTimer.status !== "paused") {
        return res.status(400).json({
          status: false,
          message: "No paused timer found to resume.",
        });
      }
      existingTimer.clockIn = now;
      existingTimer.status = "running";
      existingTimer.clockOut = null;
      await existingTimer.save();

      return res.json({
        status: true,
        message: "Timer resumed successfully",
        timer: existingTimer,
      });
    }

    // ========== END =========
    if (action === "end") {
      if (!existingTimer || existingTimer.status !== "running") {
        return res.status(400).json({
          status: false,
          message: "No running timer found to end.",
        });
      }
      const elapsed = now.getTime() - new Date(existingTimer.clockIn).getTime();
      existingTimer.clockOut = now;
      existingTimer.totalTime += elapsed;
      existingTimer.status = "ended";
      await existingTimer.save();

      return res.json({
        status: true,
        message: "Timer ended successfully",
        timer: existingTimer,
      });
    }


    // ======= INVALID ACTION ======
    return res.status(400).json({
      status: false,
      message: "Invalid action. Use: start, pause, resume, or end.",
    });
  } catch (error) {
    console.error("Error in createTaskTimer:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};


export const getUserTaskTimer = async (req, res) => {
  try {
    const submitedBy = req.user?.id;

    if (!submitedBy) {
      return res.status(400).json({
        status: false,
        message: "User ID not found in request",
      });
    }

    const activeTimer = await TaskTimer.findOne({ submitedBy, status: { $in: ["running", "paused"] } })
      .sort({ createdAt: -1 });

    if (!activeTimer) {
      return res.status(404).json({
        status: false,
        message: "No task timer found for this user",
      });
    }

    return res.status(200).json({
      status: true,
      activeTimer,
      message: "Active task timer fetched successfully",
    });

  } catch (error) {
    console.error("Error in getUserTaskTimer:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
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
        }).filter(Boolean) // null/undefined hata do
      )
    ];

    let users = [];
    if (allUserIds.length > 0) {
      const [rows] = await db.execute(
        `SELECT * FROM users WHERE id IN (${allUserIds.map(() => '?').join(',')})`,
        allUserIds
      );
      users = rows;
    }

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
    const { projectId, uploadedBy, visibleToCustomer } = req.body;
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
    const projectDetails = await Project.findById(projectId);

    const newFile = new ProjectFiles({
      projectId,
      visibleToCustomer,
      fileName: req.files.file.name,
      filePath: uploadedFile.secure_url,
      uploadedBy,
    });

    await newFile.save();
    // await Timeline.create({
    //   entityType: "Project",
    //   entityId: projectId,
    //   entityTypeRef: "Projects",
    //   action: "Created",
    //   performedBy: req.user.id,
    //   organizationId: req.user.organizationId,
    //   description: `File for project "${projectDetails.projectName}" was uploaded by ${req.user.fullName}`,
    // });

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

    const files = await ProjectFiles.find({ projectId })

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
    console.log("File ");
    if (!fileId) {
      return res.status(400).json({ status: false, message: "File ID is required" });
    }

    const file = await ProjectFiles.findById(fileId);
    if (!file) {
      return res.status(404).json({ status: false, message: "File not found" });
    }

    const projectDetails = await Project.findById(file.projectId);
    if (!projectDetails) {
      return res.status(404).json({ status: false, message: "Project not found" });
    }

    // Delete file
    await ProjectFiles.findByIdAndDelete(fileId);

    // Log timeline
    // await Timeline.create({
    //   entityType: "Project",
    //   entityId: file.projectId,
    //   entityTypeRef: "Projects",
    //   action: "Deleted",
    //   performedBy: req.user.id,
    //   organizationId: req.user.organizationId,
    //   description: `File for project "${projectDetails.projectName}" was deleted by ${req.user.fullName}`,
    // });

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



export const createNote = async (req, res) => {
  try {
    const { Note, project } = req.body;

    if (!Note || !project) {
      return res.status(400).json({ status: false, message: "Note and project ID are required" });
    }
    const projectDetails = await Project.findById(project);
    const meet = await Notes.create({ Note, project });
    await Timeline.create({
      entityType: "Project",
      entityId: project,
      entityTypeRef: "Projects",
      action: "Created",
      performedBy: req.user.id || req.user._id,
      organizationId: req.user.organizationId,
      description: `Created A Note for "${projectDetails.projectName}"`,
    });
    res.status(201).json({ status: true, meet });
  } catch (error) {
    console.error("Error creating meet:", error);
    res.status(500).json({ status: false, message: error.message, error });
  }
};

// READ all meets for a project
export const getNotesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const meets = await Notes.find({ project: projectId }).sort({ dateAdded: -1 });
    res.status(200).json({ status: true, meets });
  } catch (error) {
    console.error("Error fetching meets:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// UPDATE a meet
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { Note } = req.body;

    const meet = await Notes.findByIdAndUpdate(id, { Note }, { new: true });
    const projectDetails = await Project.findById(meet.project);

    if (!meet) {
      return res.status(404).json({ status: false, message: "Notes not found" });
    }
    await Timeline.create({
      entityType: "Project",
      entityId: meet.project,
      entityTypeRef: "Projects",
      action: "Created",
      performedBy: req.user.id,
      organizationId: req.user.organizationId,
      description: `Note for project "${projectDetails.projectName}" was updated by ${req.user.fullName}`,
    });
    res.status(200).json({ status: true, meet });
  } catch (error) {
    console.error("Error updating meet:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// DELETE a meet
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    // Pehle note find karo
    const deleted = await Notes.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ status: false, message: "Note not found" });
    }

    // Agar project exist karta hai to uska detail nikaalo
    const projectDetails = await Project.findById(deleted.project);

    // Timeline me entry add karo
    await Timeline.create({
      entityType: "Project",
      entityId: deleted.project,
      entityTypeRef: "Projects",
      action: "Deleted",
      performedBy: req.user.id,
      organizationId: req.user.organizationId,
      description: `A note linked to project "${projectDetails?.projectName || "Unknown"}" was permanently deleted by ${req.user.fullName}.`,
    });

    res.status(200).json({ status: true, message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};


// GET timeline for Client & Project only
export const getClientTimeline = async (req, res) => {
  try {
    const { organizationId } = req.user;

    // 1. Get all client timelines
    const timelines = await Timeline.find({
      entityType: "Client",
      organizationId: organizationId,
    })
      .populate("entityId") // client details
      .sort({ createdAt: -1 })
      .lean();

    if (!timelines.length) {
      return res.status(200).json({
        success: true,
        message: "No client timelines found",
        data: [],
      });
    }

    // 2. Collect performedBy IDs
    const performedByIds = timelines.map((t) => t.performedBy?.toString()).filter(Boolean);

    let userMap = {};
    if (performedByIds.length) {
      // 3. Get all users in one query
      const [users] = await db.execute(
        `SELECT * FROM users WHERE id IN (${performedByIds.map(() => "?").join(",")})`,
        performedByIds
      );

      users.forEach((u) => {
        userMap[u.id] = u.fullName;
      });
    }

    // 4. Enrich with user names
    const enrichedTimelines = timelines.map((t) => ({
      ...t,
      performedByName: userMap[t.performedBy?.toString()] || "Unknown User",
    }));

    return res.status(200).json({
      success: true,
      message: "Client timeline fetched successfully",
      data: enrichedTimelines,
    });
  } catch (error) {
    console.error("Error fetching client timeline:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch client timeline",
      error: error.message,
    });
  }
};


export const getSpecificClientTimeline = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "Client ID is required",
      });
    }

    // 1. Get timelines for that client
    const timelines = await Timeline.find({
      entityType: "Client",
      organizationId: organizationId,
      entityId: clientId,
    })
      .populate("entityId")
      .sort({ createdAt: -1 })
      .lean();

    if (!timelines.length) {
      return res.status(200).json({
        success: true,
        message: "No timeline found for this client",
        data: [],
      });
    }

    // 2. Collect performedBy IDs
    const performedByIds = timelines.map((t) => t.performedBy?.toString()).filter(Boolean);

    let userMap = {};
    if (performedByIds.length) {
      const [users] = await db.execute(
        `SELECT * FROM users WHERE id IN (${performedByIds.map(() => "?").join(",")})`,
        performedByIds
      );

      users.forEach((u) => {
        userMap[u.id] = u.fullName;
      });
    }

    // 3. Enrich timelines
    const enrichedTimelines = timelines.map((t) => ({
      ...t,
      performedByName: userMap[t.performedBy?.toString()] || "Unknown User",
    }));

    return res.status(200).json({
      success: true,
      message: "Specific client timeline fetched successfully",
      data: enrichedTimelines,
    });
  } catch (error) {
    console.error("Error fetching client timeline:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch client timeline",
      error: error.message,
    });
  }
};



// GET timeline for Client & Project only
export const getProjectTimeline = async (req, res) => {
  try {
    const { organizationId } = req.user;

    // 1. Get timelines from MongoDB
    const timelines = await Timeline.find({
      entityType: "Project",
      organizationId: organizationId,
    })
      .populate("entityId") // Project ka detail
      .sort({ createdAt: -1 })
      .lean();

    if (!timelines.length) {
      return res.status(200).json({
        success: true,
        message: "No project timelines found",
        data: [],
      });
    }

    // 2. Collect all performedBy IDs
    const performedByIds = timelines.map((t) => t.performedBy?.toString()).filter(Boolean);

    if (!performedByIds.length) {
      return res.status(200).json({
        success: true,
        message: "Project timeline fetched successfully",
        data: timelines,
      });
    }

    // 3. Fetch all users in one query (SQL)
    const [users] = await db.execute(
      `SELECT * FROM users WHERE id IN (${performedByIds.map(() => "?").join(",")})`,
      performedByIds
    );

    // 4. Convert array -> object for fast lookup
    const userMap = {};
    users.forEach((u) => {
      userMap[u.id] = `${u.fullName}`;
    });

    // 5. Attach userName to each timeline
    const enrichedTimelines = timelines.map((t) => ({
      ...t,
      performedByName: userMap[t.performedBy?.toString()] || "Unknown User",
    }));

    return res.status(200).json({
      success: true,
      message: "Project timeline fetched successfully",
      data: enrichedTimelines,
    });
  } catch (error) {
    console.error("Error fetching project timeline:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch project timeline",
      error: error.message,
    });
  }
};


export const getSpecificProjectTimeline = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    // 1. Get timelines for that project
    const timelines = await Timeline.find({
      entityType: "Project",
      organizationId: organizationId,
      entityId: projectId,
    })
      .populate("entityId")
      .sort({ createdAt: -1 })
      .lean();

    if (!timelines.length) {
      return res.status(200).json({
        success: true,
        message: "No timeline found for this project",
        data: [],
      });
    }

    // 2. Collect performedBy IDs
    const performedByIds = timelines.map((t) => t.performedBy?.toString()).filter(Boolean);

    let userMap = {};
    if (performedByIds.length) {
      const [users] = await db.execute(
        `SELECT * FROM users WHERE id IN (${performedByIds.map(() => "?").join(",")})`,
        performedByIds
      );

      users.forEach((u) => {
        userMap[u.id] = `${u.fullName}`;
      });
    }

    // 3. Enrich timelines with user names
    const enrichedTimelines = timelines.map((t) => ({
      ...t,
      performedByName: userMap[t.performedBy?.toString()] || "Unknown User",
    }));

    return res.status(200).json({
      success: true,
      message: "Specific project timeline fetched successfully",
      data: enrichedTimelines,
    });
  } catch (error) {
    console.error("Error fetching project timeline:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch project timeline",
      error: error.message,
    });
  }
};
