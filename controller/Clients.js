import Clients from "../models/Tasks/Clients.js";
import Projects from "../models/Tasks/Projects.js";
import ProjectTasks from "../models/Tasks/task.js";
import User from "../models/User/User.js";
import { mailSender } from "../utils/SendMail2.js";
import Notification from "../models/Notification/Notification.js"
import Task from "../models/Task/Task.js";
import projectwork from "../models/ProjectWork.js";
import bcrypt from "bcrypt";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SendEmail } from "../utils/SendEmail.js";
import Timeline from "../models/Tasks/ProjectTimeLine.js";
import db from "../db/sql_conn.js"

const generateRefreshToken = async (userId) => {
  try {
    const user = await Clients.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const token = user.generateAuthToken();
    return token;
  } catch (error) {
    // Log the actual error for debugging purposes
    console.error("Error in generateRefreshToken:", error.message);

    throw new ApiError(500, "Something went wrong");
  }
};

export const CreateClient = async (req, res) => {
  try {
    const { organizationId, id: performedBy } = req.user;
    const {
      Name,
      Email,
      Password,
      City,
      State,
      ZipCode,
      PhoneNumber,
      Country,
      Address,
      Company,
      Currency,
      Language,
      countryCode,
      Website,
    } = req.body;

    // Validate required fields first
    if (!Name || !Email || !Password) {
      return res.status(400).json({
        status: false,
        message: "Name, Email, and Password are required",
      });
    }

    // Run MySQL + Mongo checks in parallel
    const [userRowsPromise, clientPromise] = await Promise.all([
      db.execute(
        "SELECT 1 FROM users WHERE email = ? AND organizationId = ? LIMIT 1",
        [Email, organizationId]
      ),
      Clients.findOne({ Email }).select("_id"), // sirf id laani hai
    ]);

    const [userRows] = userRowsPromise;
    const existingClient = clientPromise;

    if (userRows.length > 0) {
      return res.status(400).json({
        status: false,
        message: "Email is already registered to a user",
      });
    }

    if (existingClient) {
      return res.status(400).json({
        status: false,
        message: "Client with this email already exists",
      });
    }

    // Hash password after validation
    const plainTextPassword = String(Password).trim();
    const hashedPassword = await bcrypt.hash(plainTextPassword, 10);

    // Create client
    const clientDetail = await Clients.create({
      Name,
      Email,
      Password: hashedPassword,
      City,
      State,
      ZipCode,
      PhoneNumber,
      Country,
      Address,
      organizationId,
      Company,
      Currency,
      Language,
      countryCode,
      Website,
      isDisable: true
    });

    // Prepare tasks for parallel execution (Timeline + Email)
    const timelineTask = Timeline.create({
      entityType: "Client",
      entityId: clientDetail._id,
      entityTypeRef: "Clients",
      action: "Created",
      performedBy,
      organizationId,
    });

    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <p>Dear <strong>${Name}</strong>,</p>
        <p>Welcome to <strong>Kushel Digi Solutions!</strong> 🎉 Your account was created on <strong>${clientDetail.createdAt}</strong>.</p>
        <ul>
          <li><strong>Username:</strong> ${Email}</li>
          <li><strong>Temporary Password:</strong> ${plainTextPassword}</li>
        </ul>
        <p>
          <a href="https://hrms.kusheldigi.com/login"
             style="background:#007bff;color:#fff;padding:10px 15px;text-decoration:none;border-radius:5px;">
            Login Here
          </a>
        </p>
        <p><strong>Change your password on first login.</strong></p>
        <br />
        <p>Best Regards, <br /><strong>Kushel Digi Solutions Team</strong></p>
      </div>
    `;

    const emailTask = SendEmail(
      organizationId,
      Email,
      "Welcome to Kushel Digi Solutions – Your Account Details",
      emailTemplate,
      emailTemplate
    );

    // Run Timeline + Email in parallel (non-blocking)
    Promise.allSettled([timelineTask, emailTask]).catch((err) =>
      console.error("Post-client tasks failed:", err)
    );

    // Send success response fast
    return res.status(201).json({
      status: true,
      message: "Client created successfully",
      data: clientDetail,
    });
  } catch (error) {
    console.error("CreateClient error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const EditClient = async (req, res) => {
  try {
    const { Name, Email, City, State, ZipCode, PhoneNumber, Country, Address, Password, Company, Currency, Language, countryCode, Website } = req.body;
    const { clientId } = req.params;
    const plainTextPassword = Password;
    const hashedPassword = await bcrypt.hash(Password, 10);

    const clientDetail = await Clients.findByIdAndUpdate(clientId, { Name, Email, City, State, ZipCode, PhoneNumber, Country, Address, Password: hashedPassword, Company, Currency, Language, countryCode, Website }, { new: true });
    await Timeline.create({
      entityType: "Client",
      entityId: clientDetail._id,
      entityTypeRef: "Clients",
      action: "Updated",
      performedBy: req.user.id,
      organizationId: req.user.organizationId,
    });
    return res.status(200).json({
      status: true,
      message: "done success",
      data: clientDetail
    })

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "interla server error "
    })
  }
}


export const clientLogin = async (req, res) => {
  try {
    const { Email, Password } = req.body;

    // Validate input
    if (!Email || !Password) {
      return res.status(400).json({
        status: false,
        message: "Email and Password are required",
      });
    }

    // Find client by email
    const client = await Clients.findOne({ Email: Email });

    if (!client) {
      return res.status(404).json({
        status: false,
        message: "Client not found with this email",
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(Password, client.Password);
    if (!isMatch) {
      return res.status(401).json({
        status: false,
        message: "Incorrect password",
      });
    }
    const token = await generateRefreshToken(client._id);
    return res.status(200).json({
      status: true,
      message: "Login successful",
      data: {
        client,
        token,
      },
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const getAllClient = async (req, res) => {
  const { organizationId } = req.user

  const allClient = await Clients.find({ organizationId });


  return res.status(200).json({
    status: true,
    message: "Done", data: allClient
  })

}

export const getClient = async (req, res) => {
  try {
    const { id } = req.params;


    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Client ID is required",
      });
    }

    const clientDetail = await Clients.findById(id);

    if (!clientDetail) {
      return res.status(404).json({
        status: false,
        message: "Client not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Client retrieved successfully",
      data: clientDetail,
    });

  } catch (error) {
    console.error("Error fetching client:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};

export const clientNotification = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { clientId } = req.params;
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        status: false,
        message: "Title and description are required",
      });
    }

    // Client find karo by ID + organizationId
    const clientDoc = await Clients.findOne({
      _id: clientId,
      organizationId,
    });

    if (!clientDoc) {
      return res.status(404).json({
        status: false,
        message: "Client not found for this organization",
      });
    }

    // New notification create
    const newNotification = new Notification({
      title,
      description,
      organizationId,
      userIds: [String(clientDoc._id)], // single client ke liye
      readBy: [],
    });

    const savedNotification = await newNotification.save();

    return res.status(201).json({
      status: true,
      message: "Notification created successfully for the client",
      data: savedNotification,
    });

  } catch (error) {
    console.error("Error creating client notification:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


import mongoose from "mongoose";
// import Clients from "../models/Clients.js";
// import Notification from "../models/Notification.js";

export const getClientNotification = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        status: false,
        message: "Client ID is required",
      });
    }

    // 1️⃣ Fetch notifications for this client
    const notifications = await Notification.find({
      userIds: clientId,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!notifications.length) {
      return res.status(200).json({
        status: true,
        message: "No notifications found",
        data: [],
      });
    }

    // 2️⃣ Extract only MongoDB IDs from userIds
    const mongoIds = [
      ...new Set(
        notifications
          .flatMap(n => n.userIds)
          .filter(id => mongoose.Types.ObjectId.isValid(id))
      ),
    ];

    // 3️⃣ Fetch matching client details
    const clients = await Clients.find({ _id: { $in: mongoIds } })
      .select("_id Name Email profileImage role designation")
      .lean();

    const clientMap = Object.fromEntries(
      clients.map(c => [
        c._id.toString(),
        {
          fullName: c.Name || "",
          email: c.Email || "",
          id: c._id.toString(),
          profileImage: c.profileImage || "",
          role: c.role || "",
          designation: c.designation || "",
        },
      ])
    );

    // 4️⃣ Build final response format
    const formattedNotifications = notifications.map(n => ({
      _id: n._id,
      title: n.title,
      description: n.description,
      date: n.date || n.createdAt?.getTime().toString() || "",
      user: n.userIds
        .map(id => clientMap[id])
        .filter(Boolean), // only Mongo clients, ignore SQL IDs
      IsRead: n.readBy?.includes(clientId) || false,
      __v: n.__v || 0,
    }));

    return res.status(200).json({
      status: true,
      message: "Client notifications fetched successfully",
      data: formattedNotifications,
    });

  } catch (error) {
    console.error("Error fetching client notifications:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const DisableClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    // Find the client by ID
    const client = await Clients.findById(clientId);

    if (!client) {
      return res.status(404).json({
        status: false,
        message: 'Client not found'
      });
    }

    // Toggle the isDisable field
    const updatedClient = await Clients.findByIdAndUpdate(
      clientId,
      { isDisable: !client.isDisable },
      { new: true }
    );

    // Convert boolean to Active/Deactive
    const oldStatus = client.isDisable ? "Active" : "Deactive";
    const newStatus = updatedClient.isDisable ? "Active" : "Deactive";
    // Create timeline entry
    await Timeline.create({
      entityType: "Client",
      entityId: client._id,
      entityTypeRef: "Clients",
      action: "Updated",
      description: `Updated Status ${oldStatus} to ${newStatus}`,
      performedBy: req.user?.id,
      organizationId: req.user?.organizationId,
    });

    return res.status(200).json({
      status: true,
      data: updatedClient
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: 'Server error',
      error: error.message
    });
  }
};


export const DeleteClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    // Find the client by ID
    const client = await Clients.findById(clientId);

    if (!client) {
      return res.status(404).json({
        status: false,
        message: 'Client not found'
      });
    }

    // Delete the client
    await Clients.findByIdAndDelete(clientId);
    await Timeline.create({
      entityType: "Client",
      entityId: client._id,
      entityTypeRef: "Clients",
      action: `Deleted`,
      performedBy: req.user?.id,
      organizationId: req.user?.organizationId,
      deletedDataName: client.Name,
    });

    return res.status(200).json({
      status: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: 'Server error',
      error: error.message
    });
  }
};


// FOR CLIENTS
export const CreateProject = async (req, res) => {
  try {

    const { Name, Description, Employee, Status, DueDate, Members } = req.body;

    const projectDetail = await Projects.create({ Name, Description, Employee, Status, DueDate, Members });
    return res.status(200).json({
      status: true,
      message: "Successfuly done",
      projectDetail
    })

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error "
    })
  }
}

export const EditProject = async (req, res) => {
  try {
    const { Name, Description, Employee, Status, DueDate, Members } = req.body;

    const { projectId } = req.params;

    console.log('rid ', projectId);

    const ProjectDetail = await Projects.findByIdAndUpdate(projectId, { Name, Description, Employee, Status, DueDate, Members });

    return res.status(200).json({
      status: true,
      message: "done success",
      data: ProjectDetail
    })

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "interla server error "
    })
  }
}

export const getAllProject = async (req, res) => {

  const allClient = await Projects.find({}).populate("Members");

  return res.status(200).json({
    status: true,
    message: "Done", data: allClient
  })

}

export const DeleteProjects = async (req, res) => {
  const { projectId } = req.params;

  const ans = await Projects.findByIdAndDelete(projectId);

  return res.status(200).json({
    status: true,
    message: "Successfuly data ",
    data: ans

  })
}

export const delteTaskId = async (req, res) => {
  const { id } = req.params;
  const taskdetail = await ProjectTasks.findByIdAndDelete(id);

  return res.status(200).json({
    status: true,
    message: 'Done',
    data: taskdetail
  })
}

export const getProjectByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const projects = await Projects.find({ Members: userId }).populate('Members');

    res.status(200).json({
      status: true,
      projects
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      messag: "intenal server error "
    })

  }
}


// for task of project 
export const CreateProjectTask = async (req, res) => {
  try {

    const { Title, Description, Github, Members, StartDate, DueDate, Priority } = req.body;
    const { projectId } = req.params;

    const taskDetail = await ProjectTasks.create({ Title, Github, Description, Members, StartDate, DueDate, Priority, Project: projectId });

    const projectDetail = await Projects.findById(projectId);

    const memberdetail = await User.findById(Members);

    await mailSender(organizationId, memberdetail.email, `Regarding New Task`, `<div>
      <div>Project: ${projectDetail?.Name}</div>
      <div>Subject: ${Title}</div>
      <div>Priority: ${Priority}</div>
     
      </div>`);


    let Nottitle = `${projectDetail?.Name} Task`;
    let notDes = `${Title} `

    const newNotification = await Notification.create({ title: Nottitle, description: notDes, user: Members })


    return res.status(200).json({
      status: true,
      data: taskDetail,
      newNotification
    })

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    })
  }
}

// export const editProjectTask = async (req, res) => {
//   try {

//     const { Title, Description, Github, Members, StartDate, DueDate, Priority } = req.body;
//     const { projectId } = req.params;

//     const taskDetail = await ProjectTasks.findById(projectId);
//     taskDetail.Title = Title;
//     taskDetail.Description = Description;
//     taskDetail.Github = Github;
//     taskDetail.StartDate = StartDate;
//     taskDetail.DueDate = DueDate;

//     await taskDetail.save();

//     const projectDetail = await Projects.findById(projectId);

//     const memberdetail = await User.findById(Members);

//     await mailSender(memberdetail.email, `Regarding Update Task`, `<div>
//       <div>Project: ${projectDetail?.Name}</div>
//       <div>Subject: ${Title}</div>
//       <div>Priority: ${Priority}</div>

//       </div>`);


//     let Nottitle = `${projectDetail?.Name} Task`;
//     let notDes = `${Title} `

//     const newNotification = await Notification.create({ title: Nottitle, description: notDes, user: Members })


//     return res.status(200).json({
//       status: true,
//       data: taskDetail,
//       newNotification
//     })

//   } catch (error) {
//     return res.status(500).json({
//       status: false,
//       message: error.message,
//     })
//   }
// }

export const EditProjectTask = async (req, res) => {
  const { Title, Description, Github, Members, StartDate, DueDate, Priority } = req.body;
  const { projectId } = req.params;

  const { taskId } = req.params;
  console.log("projectid", taskId);

  const taskDetail = await ProjectTasks.findByIdAndUpdate(taskId, { Title, Description, Github, Members, StartDate, DueDate, Priority, Project: projectId });

  const projectDetail = await Projects.findById(projectId);

  const memberdetail = await User.findById(Members);

  await mailSender(organizationId, memberdetail.email, `Regarding New Task`, `<div>
      <div>Project: ${projectDetail?.Name}</div>
      <div>Subject: ${Title}</div>
      <div>Priority: ${Priority}</div>
     
      </div>`);


  let Nottitle = `${projectDetail?.Name} Task`;
  let notDes = `${Title} `

  const newNotification = await Notification.create({ title: Nottitle, description: notDes, user: Members })


  return res.status(200).json({
    status: true,
    data: taskDetail,
    newNotification
  })
}

export const GetAllTask = async (req, res) => {
  try {

    const allTasks = await ProjectTasks.find({});

    return res.status(200).json({
      status: true,
      data: allTasks
    })

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    })
  }
}

export const GetTaskByUser = async (req, res) => {
  try {

    const { userId } = req.params;

    const allTasks = await ProjectTasks.find({ Members: userId }).populate("Members").populate("Project");

    return res.status(200).json({
      status: true,
      data: allTasks
    })

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    })
  }
}

export const getTaskByUserProject = async (req, res) => {
  try {

    const { userId, projectId } = req.params;

    const allTasks = await ProjectTasks.find({ Members: userId, Project: projectId }).populate("Members").populate("Project");

    return res.status(200).json({
      status: true,
      data: allTasks
    })

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    })
  }
}

export const getProjectTask = async (req, res) => {
  try {

    const { projectId } = req.params;

    const allTasks = await ProjectTasks.find({ Project: projectId }).populate("Members").populate("Project");
    const taskDetail = await projectwork.find({ projectId });

    return res.status(200).json({
      status: true,
      data: allTasks,
      data2: taskDetail
    })

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    })
  }
}

export const FetchAllTask = async (req, res) => {
  const alltask = await ProjectTasks.find({})
    .sort({ date: -1 })
    .populate("Members", "fullName")
    .populate({
      path: "Project",
      populate: {
        path: "Members", // Members inside Project
      }
    });;
  return res.status(200).json({
    status: true,
    data: alltask
  })
}

export const getMyProjectTask = async (req, res) => {
  try {

    const { projectId, memberId } = req.params;

    const allTasks = await ProjectTasks.find({ Project: projectId, Members: memberId }).populate("Members").populate("Project");

    return res.status(200).json({
      status: true,
      data: allTasks
    })

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    })
  }
}

export const changeTaskStatus = async (req, res) => {
  try {

    const { taskStatus } = req.body;
    const { taskId } = req.params;

    const allTasks = await ProjectTasks.findByIdAndUpdate(taskId, { Status: taskStatus }, { new: true });

    return res.status(200).json({
      status: true,
      data: allTasks
    })

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    })
  }
}


// user birthdate 

export const getTodayBirthday = async (req, res) => {
  try {
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // Months are zero-based, so add 1
    const todayDate = today.getDate();

    // Get employees whose birthday is today
    const employeesWithBirthdayToday = await User.find().exec();

    // Filter employees whose month and day of dob match today's month and day
    const filteredEmployees = employeesWithBirthdayToday.filter(employee => {
      const dob = new Date(employee.dob);
      return (dob.getMonth() + 1 === todayMonth) && (dob.getDate() === todayDate) && employee.isDeactivated === "No";
    });



    res.status(200).json(filteredEmployees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUpcomingBirthdays = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    const currentDate = today.getDate();

    // Get all users
    const [employees] = await db.execute(
      'SELECT * FROM users WHERE organizationId = ? ORDER BY updatedAt DESC',
      [organizationId]
    );

    const filteredEmployees = employees.filter(employee => {
      if (!employee.dob || employee.isDeactivated !== "No") return false;

      let dob;

      // Try to parse manually
      if (typeof employee.dob === 'string') {
        if (employee.dob.includes('/')) {
          // Format: DD/MM/YYYY
          const [day, month, year] = employee.dob.split('/');
          dob = new Date(`${year}-${month}-${day}`); // Convert to ISO format
          // 2000-12-07
          // console.log(dob)
        } else {
          dob = new Date(employee.dob); // ISO or full timestamp
          // console.log(dob)
        }
      } else {
        dob = new Date(employee.dob); // Already a Date object
        // console.log(dob)
      }

      if (isNaN(dob)) return false; // Invalid date

      const birthMonth = dob.getMonth(); // 0-indexed
      const birthDate = dob.getDate();

      let monthDiff = birthMonth - currentMonth;
      if (monthDiff < 0) monthDiff += 12;

      return (
        monthDiff <= 2 &&
        (monthDiff > 0 || birthDate >= currentDate)
      );
    });
    console.log(filteredEmployees)
    res.status(200).json(filteredEmployees);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
