import Leave from "../models/Leave/Leave.js";
import HalfDay from "../models/Leave/HalfDay.js";
import User from "../models/User/User.js";
import { removeUndefined } from "../utils/util.js";
import { mailSender } from "../utils/SendMail2.js";
import EmployeeLeave from "../models/EmployeeLeave/employeeLeave.js"
import db from "../db/sql_conn.js";

// Fro create Leave
export const postLeave = async ({ auth, type, from, to, days, reason }) => {
  try {

    const newLeave = new Leave({
      user: auth.id.toString(),
      leaveType: type,
      from,
      to,
      days,
      reason,
      status: "pending",
      ts: Date.now(),
      organizationId: auth.organizationId
    });

    const saveLeaveResult = await newLeave.save();

    // Send email asynchronously (doesn't block the response)
    mailSender("hr@kusheldigi.com", "Regarding Leave", `
      <div>
        <div><strong>From:</strong> ${auth.fullName}</div>
        <div><strong>To:</strong> ${to}</div>
        <div><strong>Days:</strong> ${days}</div>
        <div><strong>Reason:</strong> ${reason}</div>
      </div>
    `).catch(err => console.error("Email sending failed:", err));

    return { success: true, message: "New leave created", leaveId: saveLeaveResult._id };
  } catch (error) {
    console.error("Error in postLeave:", error);
    return { success: false, message: "Failed to create leave request", error: error.message };
  }
};

// To fetch User all Leaves
export const FetchUserLeave = async (req, res) => {
  try {

    const { userId } = req.params;

    const [fullDayLeaves, halfDayLeaves] = await Promise.all([
      Leave.find({ user: userId }).sort({ date: -1 }),
      HalfDay.find({ user: userId }).sort({ date: -1 })
    ]);


    return res.status(200).json({
      status: true,
      // data: allLeaves
      data: {
        fullDayLeaves,
        halfDayLeaves
      }
    })

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    })
  }
}

// for create half day leave
export const postHalfDay = async ({ auth, from, to, days, reason }) => {
  try {
    // Create new HalfDay leave entry
    const newLeave = new HalfDay({
      user: auth.id.toString(),
      from,
      to,
      days,
      reason,
      status: "pending", // default meaningful status
      ts: Date.now(),
      organizationId: auth.organizationId
    });

    const saveLeaveResult = await newLeave.save();

    // Send email asynchronously (non-blocking)
    mailSender("hr@kusheldigi.com", "Regarding Half Day", `
      <div>
        <div><strong>From:</strong> ${auth.fullName}</div>
        <div><strong>To:</strong> ${to}</div>
        <div><strong>Days:</strong> ${days + 1}</div>
        <div><strong>Reason:</strong> ${reason}</div>
      </div>
    `).catch(err => console.error("Half-day email sending failed:", err));

    return {
      success: true,
      message: "New half-day leave created",
      leaveId: saveLeaveResult._id
    };
  } catch (error) {
    console.error("Error in postHalfDay:", error);
    return {
      success: false,
      message: "Failed to create half-day leave request",
      error: error.message
    };
  }
};


export const postAllowance = async ({ user, allowance }) => {

  const userDetail = await User.findById(user).populate("PermissionRole");

  userDetail.userAllowance = allowance;
  await userDetail.save();

  return { success: true, message: "New allowance created", userDetail };
};

// export const LeaveTypeApi = async ({ id }) => {

//   const userLeave = await Leave.find({user:id});

//    const paidLeave = userLeave.filter((lev)=> lev?.leaveType === "Paid Leave" || lev?.leaveType === '' );
//    const casualLeave = userLeave.filter((lev)=> lev?.leaveType === "Casual Leave" || lev?.leaveType === 'Sick Leave');

//   return { success: true, message: "New allowance created" , data:{paidLeave: paidLeave?.length , casualLeave : casualLeave?.length , totalLeaves:userLeave.length} };
// };


export const LeaveTypeApi = async ({ id }) => {
  try {
    const currentYear = new Date().getFullYear();
    const yearStartDate = new Date(`${currentYear}-01-01`);
    const yearEndDate = new Date(`${currentYear}-12-31`);

    // Fetch all leaves for the user
    const userLeaves = await Leave.find({ user: id });
    const userHalfDays = await HalfDay.find({ user: id });

    // Filter leaves based on the 'from' date for the current year
    const filteredLeaves = userLeaves.filter((leave) => {
      const leaveStartDate = new Date(leave.from);
      return leaveStartDate >= yearStartDate && leaveStartDate <= yearEndDate;
    });

    const filteredHalfDays = userHalfDays.filter((leave) => {
      const leaveStartDate = new Date(leave.from);
      return leaveStartDate >= yearStartDate && leaveStartDate <= yearEndDate;
    });

    // Count leave types
    const paidLeave = filteredLeaves.filter(
      (leave) => leave?.leaveType === "Paid Leave" || leave?.leaveType === ""
    ).length;

    const casualLeave = filteredLeaves.filter(
      (leave) => leave?.leaveType === "Casual Leave" || leave?.leaveType === "Sick Leave"
    ).length;

    const halfDayCount = filteredHalfDays.length;

    return {
      success: true,
      message: "Leave data fetched successfully",
      data: {
        paidLeave,
        casualLeave,
        totalLeaves: filteredLeaves.length,
        halfDays: halfDayCount,
      },
    };
  } catch (error) {
    console.error("Error fetching leave data:", error);
    return {
      success: false,
      message: "Internal server error",
    };
  }
};


// export const monthlyLeave = async(req , res)=>{
//   const {month} = req.body;
//  if(month){
//   const now = new Date();
//     const year = now.getFullYear();

//     // If month is provided, ensure it's a valid number between 1 and 12
//     if (month < 1 || month > 12) {
//       return res.status(400).json({
//         status: false,
//         message: "Invalid month value"
//       });
//     }

//     // Calculate the start and end dates for the specified month
//     const startOfMonth = new Date(year, month - 1, 1);
//     const endOfMonth = new Date(year, month, 0); // Last day of the month

//     // Format dates if needed
//     const formattedStartOfMonth = formatDate(startOfMonth);
//     const formattedEndOfMonth = formatDate(endOfMonth);

//     // Fetch leave records within the specified month
//     const leaves = await Leave.find({
//       from: { $gte: formattedStartOfMonth },
//       to: { $lte: formattedEndOfMonth },
//       status: 'Accepted'
//     }).populate("user");

//     console.log("leave",leaves);

//     return res.status(200).json({
//       status: true,
//       data: leaves
//     });
//  }
//  else {
//   const now = new Date();
//   const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

//   const formattedStartOfMonth = formatDate(startOfMonth);

//   const leaves = await Leave.find({
//     from: { $gt: formattedStartOfMonth },
//     status:'Accepted'
//   }).populate("user");

//   return res.status(200).json({
//     status:true ,
//     data:leaves
//   })
//  }

// }

export const monthlyLeave = async (req, res) => {
  const { month } = req.body;


  const now = new Date();
  const year = now.getFullYear();

  // Determine the month to be used (provided month or current month)
  const targetMonth = month ? month - 1 : now.getMonth();

  // Calculate the start and end dates for the specified month
  const startOfMonth = new Date(year, targetMonth, 1);
  const endOfMonth = new Date(year, targetMonth + 1, 0); // Last day of the month

  // Format dates if needed
  const formattedStartOfMonth = formatDate(startOfMonth);
  const formattedEndOfMonth = formatDate(endOfMonth);

  // Fetch leave records within the specified month
  const leaves = await Leave.find({
    from: { $gte: formattedStartOfMonth },
    to: { $lte: formattedEndOfMonth },
    status: 'Accepted',
  }).populate("user");

  // Consolidate leaves by user
  const consolidatedLeaves = {};

  leaves.forEach((leave) => {

    const userId = leave.user._id.toString();
    const leaveDays = parseInt(leave.days) + 1;

    if (!consolidatedLeaves[userId]) {
      consolidatedLeaves[userId] = {
        user: leave.user,
        totalDays: 0,
        sickLeave: 0,
        paidLeave: 0,
        UnpaidLeave: 0,
        casualLeave: 0,
        other: 0,
        paidLeave: 0

      };
    }

    consolidatedLeaves[userId].totalDays += leaveDays;


    if (leave?.leaveType === 'Sick Leave' && leaveDays != NaN) {
      consolidatedLeaves[userId].sickLeave += leaveDays;
    }
    else if (leave?.leaveType === 'Unpaid Leave' && leaveDays != NaN) {
      consolidatedLeaves[userId].UnpaidLeave += leaveDays;
    }
    else if (leave?.leaveType === 'Casual Leave' && leaveDays != NaN) {
      consolidatedLeaves[userId].casualLeave += leaveDays;
    }
    else if (leave?.leaveType === 'Paid Leave' && leaveDays != NaN) {
      consolidatedLeaves[userId].paidLeave += leaveDays;
    }
    else {
      consolidatedLeaves[userId].other += leaveDays;
    }


  });

  // Convert consolidated leaves object to an array
  const result = Object.values(consolidatedLeaves);

  return res.status(200).json({
    status: true,
    data: result,
  });
};

export const updateLeave = async ({ auth, employeeName, id, leaveType, from, to, days, reason, status }) => {
  try {
    if (!id) return { success: false, message: "Leave ID is required" };

    // Build update object with only defined values
    const updateObj = removeUndefined({
      leaveType,
      from,
      to,
      days,
      reason,
      status
    });

    // Update leave entry in DB
    const updatedLeave = await Leave.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true }
    );

    if (!updatedLeave) {
      return { success: false, message: "Leave not found" };
    }

    // Get user info from DB (using the user ID from updated leave)
    const [userRows] = await db.execute('SELECT * FROM users WHERE id = ?', [updatedLeave.user]);
    const employee = userRows?.[0];

    if (!employee) {
      return { success: false, message: "Employee not found" };
    }

    // Send email asynchronously
    mailSender(employee.email, "Leave Updated", `
      <div>
        <div><strong>Updated by:</strong> ${auth?.fullName}</div>
        <div><strong>Leave Type:</strong> ${leaveType}</div>
        <div><strong>From:</strong> ${from}</div>
        <div><strong>To:</strong> ${to}</div>
        <div><strong>Days:</strong> ${days + 1}</div>
        <div><strong>Reason:</strong> ${reason}</div>
        <div><strong>Status:</strong> ${status || 'unchanged'}</div>
      </div>
    `).catch(err => console.error("Email send failed:", err));

    return {
      success: true,
      message: "Leave updated",
      updatedLeave
    };
  } catch (error) {
    console.error("Error in updateLeave:", error);
    return {
      success: false,
      message: "Error updating leave",
      error: error.message
    };
  }
};




export const getUserLeaves = async ({ auth }) => {
  // 1. Fetch all leaves (or filter by auth.id if needed)
  const leaves = await Leave.find({ organizationId: auth.organizationId }); // or { user: auth.id.toString() }
  // console.log(leaves)
  if (leaves.length < 1) {
    return {
      success: true,
      message: "No Leaves Found",
      data: []
    };
  }
  // 2. Extract all unique user IDs from leaves
  const userIds = [...new Set(leaves.map(leave => leave.user))];

  // 3. Fetch all corresponding users from SQL in one query
  const [users] = await db.execute(
    `SELECT * FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`,
    userIds
  );

  // 4. Build a map of userId -> userData
  const userMap = {};
  users.forEach(user => {
    userMap[user.id] = user;
  });

  // 5. Attach user data to each leave
  const enrichedLeaves = leaves.map(leave => ({
    ...leave.toObject(),
    user: userMap[leave.user]  // replace user ID with full SQL user
  }));

  return { success: true, data: enrichedLeaves };
};


export const getUserHalfDay = async ({ auth }) => {
  const leaves = await HalfDay.find({ organizationId: auth.organizationId });
  // 2. Extract all unique user IDs from leaves
  const userIds = [...new Set(leaves.map(leave => leave.user))];

  // 3. Fetch all corresponding users from SQL in one query
  const [users] = await db.execute(
    `SELECT * FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`,
    userIds
  );

  // 4. Build a map of userId -> userData
  const userMap = {};
  users.forEach(user => {
    userMap[user.id] = user;
  });

  // 5. Attach user data to each leave
  const enrichedLeaves = leaves.map(leave => ({
    ...leave.toObject(),
    user: userMap[leave.user]  // replace user ID with full SQL user
  }));

  return { success: true, data: enrichedLeaves };
};

export const getUserLeaveById = async ({ auth, id }) => {
  if (!auth) {
    return { success: false, message: "Not Authorised" };
  }

  const data = await Leave.findById(id);
  return { success: true, data };
};

export const deleteLeave = async ({ auth, id }) => {
  if (!auth) {
    return { success: false, message: "Not Authorised" };
  }

  const data = await Leave.findByIdAndDelete(id);
  return { success: true, data };
};

export const deleteAllLeaves = async () => {
  const data = await Leave.deleteMany();
  return { success: true, data };
};

// export const deleteAll = async()=>{
//   const
// }

export const getTotalLeaveCount = async () => {
  // const data = await Leave.find({status:"Pending"});

  const data = await Leave.find({
    $or: [
      { status: "Pending" },
      { status: "" },
      { status: { $exists: false } }
    ]
  });

  const data2 = await HalfDay.find({
    $or: [
      { status: "Pending" },
      { status: "" },
      { status: { $exists: false } }
    ]
  });

  const totalLeave = data.length;
  const halfDay = data2.length;

  return {
    success: true,
    totalLeave, halfDay
  }
}

// For reject leave
export const rejectLeaveHandler = async ({ fullName, id }) => {
  try {
    const leaveDetails = await Leave.findById(id);
    if (!leaveDetails) {
      return { status: false, message: "Leave not found" };
    }

    leaveDetails.status = "Rejected";
    await leaveDetails.save();

    const [userRows] = await db.execute('SELECT email FROM users WHERE id = ?', [leaveDetails.user]);
    const userDetail = userRows[0];
    if (!userDetail) return { status: false, message: "User not found" };

    try {
      await mailSender(userDetail.email, "Regarding Half Day Cancel", `
        <div>
          <div>Your Half Days are cancelled by admin</div>
        </div>
      `);
    } catch (err) {
      console.error("Email failed:", err);
      return { status: false, message: "Leave updated but email sending failed" };
    }

    return {
      status: true,
      message: "Successfully sent the email and updated leave"
    };
  } catch (error) {
    console.error("rejectHalfDayHandler error:", error);
    return {
      status: false,
      message: "An error occurred while processing leave",
      error: error?.message || String(error)
    };
  }
}

// For reject half day
export const rejectHalfDayHandler = async ({ fullName, id }) => {
  try {
    const leaveDetails = await HalfDay.findById(id);
    if (!leaveDetails) {
      return { status: false, message: "Leave not found" };
    }

    leaveDetails.status = "Rejected";
    await leaveDetails.save();

    const [userRows] = await db.execute('SELECT email FROM users WHERE id = ?', [leaveDetails.user]);
    const userDetail = userRows[0];
    if (!userDetail) return { status: false, message: "User not found" };

    try {
      await mailSender(userDetail.email, "Regarding Half Day Cancel", `
        <div>
          <div>Your Half Days are cancelled by admin</div>
        </div>
      `);
    } catch (err) {
      console.error("Email failed:", err);
      return { status: false, message: "Leave updated but email sending failed" };
    }

    return {
      status: true,
      message: "Successfully sent the email and updated leave"
    };
  } catch (error) {
    console.error("rejectHalfDayHandler error:", error);
    return {
      status: false,
      message: "An error occurred while processing leave",
      error: error?.message || String(error)
    };
  }
};

// For accept leave
export const acceptLeaveHandler = async ({ id, userId, startDate, endDate }) => {
  try {
    const leaveDetails = await Leave.findById(id);
    if (!leaveDetails) return { status: false, message: "Leave not found" };

    leaveDetails.status = "Accepted";
    const saveLeavePromise = leaveDetails.save();

    const [userRows] = await db.execute('SELECT * FROM users WHERE id = ?', [leaveDetails.user]);
    const userDetail = userRows[0];
    if (!userDetail) return { status: false, message: "User not found" };

    const adjustedDays = parseInt(leaveDetails.days, 10) + 1;
    const emailSubject = `Total holiday of ${adjustedDays} days`;
    const emailBody = `<div><div>Total holiday of ${adjustedDays} days Accepted</div></div>`;

    // Fire and forget the email
    mailSender(userDetail.email, emailSubject, emailBody)
      .catch(err => console.error("Email failed:", err));

    await Promise.all([
      EmployeeLeave.create({ startDate, endDate, user: userDetail.id }),
      saveLeavePromise
    ]);

    return {
      status: true,
      message: "Leave accepted. Email sending in progress."
    };
  } catch (error) {
    console.error("Error in acceptLeaveHandler:", error);
    return {
      status: false,
      message: "An error occurred while processing leave",
      error: error?.message || error
    };
  }
};

// For accept half day
export const acceptHalfDayHandler = async ({ fullName, days, id, userId, startDate, endDate }) => {

  const leaveDetails = await HalfDay.findById(id);

  leaveDetails.status = "Accepted";

  await leaveDetails.save();

  const [userRows] = await db.execute('SELECT * FROM users WHERE id = ?', [leaveDetails.user]);

  // const userDetail = await User.findOne({ fullName: fullName });
  const userDetail = userRows[0]

  const subject = `total Half Day of ${days} days`;

  await mailSender(userDetail?.email, "Accept Half Day ", `<div>
   <div>total Half Days of ${parseInt(days) + 1} days Accepted</div>

  </div>`)


  // const leaveDetailing = await EmployeeLeave.create({ startDate, endDate, user: userId });

  return {
    status: true,
    message: "Successfuly send the email"
  }


}

// To get today leaves

function parseDate(dateStr) {
  // If format is DD/MM/YYYY
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`);
  }

  // If format is YYYY-MM-DD or already a valid date
  return new Date(dateStr);
}

function isCurrentDateBetween(startDateStr, endDateStr) {
  const startDate = parseDate(startDateStr);
  const endDate = parseDate(endDateStr);
  const currentDate = new Date();

  // Remove time from all dates for accurate comparison
  const onlyDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return (
    onlyDate(currentDate) >= onlyDate(startDate) &&
    onlyDate(currentDate) <= onlyDate(endDate)
  );
}

export const GetTodayLeave = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    // console.log(organizationId);
    // Fetch all leaves
    const allLeaves = await Leave.find({ organizationId });

    // Filter leaves where today is between from and to (inclusive)
    const todaysLeaves = allLeaves.filter((leave) => {
      return leave.status === "Accepted" && isCurrentDateBetween(leave.from, leave.to);
    });


    // console.log("Today's Accepted Leaves:", todaysLeaves);

    if (todaysLeaves.length < 1) {
      return res.status(200).json({
        status: true,
        message: "No Leaves Found for today",
        data: []
      });
    }

    // Extract unique user IDs
    const userIds = [...new Set(todaysLeaves.map(leave => leave.user?.toString()))];

    // Fetch user info from SQL
    const [users] = await db.execute(
      `SELECT * FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`,
      userIds
    );


    // Map user ID to user object
    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = user;
    });

    // Attach user info
    const enrichedLeaves = todaysLeaves.map(leave => ({
      ...leave.toObject(),
      user: userMap[leave.user?.toString()] || null
    }));

    return res.status(200).json({
      status: true,
      message: "Today's leaves fetched successfully",
      data: enrichedLeaves
    });

  } catch (error) {
    console.error("GetTodayLeave error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
};