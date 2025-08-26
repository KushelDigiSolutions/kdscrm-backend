import mongoose from "mongoose";
import ActivityTracker from "../models/ActivityTracker/ActivityTracker.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import db from "../db/sql_conn.js"

const startOfWeek = (date) => {
  var diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

// Start
export const postActivity = async (req, res) => {
  try {
    const { organizationId, id: userId } = req.user;
    const { date, checkInTime,breaks, checkOutTime, task, status } = req.body;
    // const breaks = false;

    // Check and delete any existing activity
    const existingActivity = await ActivityTracker.findOneAndDelete({ userId });

    if (existingActivity) {
      const [rows] = await db.execute("SELECT isBreakIn FROM users WHERE id = ?", [userId]);
      if (rows.length === 0) {
        return res.status(404).json({ status: false, message: "User not found in SQL DB" });
      }
      await db.execute("UPDATE users SET isBreakIn = ? WHERE id = ?", [0, userId]);
      return res.status(200).json({
        success: true,
        message: "Previous activity deleted successfully",
        deletedData: existingActivity,
      });
    }

    const newActivity = await ActivityTracker.create({
      userId,
      organizationId,
      date,
      checkInTime,
      breaks,
      checkOutTime,
      task,
      status,
    });

    return res.status(201).json({
      status: true,
      message: "Activity created successfully",
      data: newActivity,
    });

  } catch (error) {
    console.error("Activity post error:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};


export const getAllClocks = async (req, res) => {
  try {
    const { organizationId } = req?.user;
    if (!organizationId) {
      return res.status(401).json({ status: false, message: "Unauthorized or missing organizationId" });
    }
    // Step 1: Get all ActivityTracker records
    const clocks = await ActivityTracker.find({ organizationId }).lean(); // .lean() for plain objects

    if (!clocks.length) {
      return res.status(200).json({ status: true, message: "No clocks found" });
    }

    // Step 2: Extract all unique userIds
    const userIds = [...new Set(clocks.map(clock => clock.userId))];

    // Step 3: Fetch users from SQL in one query
    const placeholders = userIds.map(() => '?').join(',');
    const [users] = await db.execute(
      `SELECT * FROM users WHERE id IN (${placeholders})`,
      userIds
    );

    // Convert SQL users to a map for quick lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = user;
    });

    // Step 4: Attach user info to each clock
    const enrichedClocks = clocks.map(clock => ({
      ...clock,
      user: userMap[clock.userId] || null
    }));

    return res.status(200).json({
      status: true,
      message: "Fetched successfully",
      data: enrichedClocks
    });

  } catch (error) {
    console.error("Get all clocks error:", error);
    return res.status(500).json({
      status: false,
      message: "Fetch failed",
      error: error.message
    });
  }
};

export const breakIn = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Get ActivityTracker document from MongoDB
    const activity = await ActivityTracker.findById(id);
    if (!activity) {
      return res.status(404).json({ status: false, message: "Activity not found" });
    }

    const userId = activity.userId;

    // Step 2: Get user from SQL DB
    const [rows] = await db.execute("SELECT isBreakIn FROM users WHERE id = ?", [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ status: false, message: "User not found in SQL DB" });
    }

    const currentStatus = rows[0].isBreakIn;

    // Step 3: Toggle isBreakIn value
    const newStatus = currentStatus ? 0 : 1;

    await db.execute("UPDATE users SET isBreakIn = ? WHERE id = ?", [newStatus, userId]);

    // Step 4: Update breaks in ActivityTracker
    const updatedClock = await ActivityTracker.findByIdAndUpdate(req.params.id, req.body, { new: true });

    return res.status(200).json({
      status: true,
      message: `Break ${newStatus ? "started" : "ended"} successfully`,
      updatedActivity: updatedClock,
      userBreakStatus: !!newStatus
    });

  } catch (error) {
    console.error("BreakIn error:", error);
    return res.status(500).json({ status: false, message: "Server error", error: error.message });
  }
};

export const getClockByUser = async (req, res) => {
  try {
    const { id } = req.user;

    // Step 1: Fetch activity records from MongoDB
    const clocks = await ActivityTracker.find({ userId: id }).lean();

    if (!clocks.length) {
      return res.status(404).json({
        status: false,
        message: "No activity records found for this user"
      });
    }

    // Step 2: Fetch user details from SQL
    const [users] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    const user = users.length ? users[0] : null;
    delete user.password;

    // Step 3: Attach user info to each clock record
    const enrichedClocks = clocks.map(clock => ({
      ...clock,
      user
    }));

    return res.status(200).json({
      status: true,
      message: "Fetched user's clocks successfully",
      data: enrichedClocks
    });

  } catch (error) {
    console.error("Error in getClockByUser:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};
//End



/*
export const getActivity = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId);
    const activity = await ActivityTracker.find({ user: userId });
    if (!activity) {
      return res.status(400).json({
        success: false,
        message: "Not Have any activity",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Activity find",
      activity,
    });
  } catch (error) {
    console.error("Error in postActivity:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});


// Not in use
export const postActivityHr = asyncHandler(async (req, res) => {
  const { status, hours, overtime, breaks, activity, date } = req.body;

  try {
    let updateActivity;

    const checkActivity = await ActivityTracker.findOne({
      user: req.user._id,
      date,
    });

    if (checkActivity) {
      const updatedActivities = [...checkActivity.activity, ...activity];
      const updateObj = {
        activity: updatedActivities,
        breaks,
        overtime,
        hours,
      };

      updateActivity = await ActivityTracker.findByIdAndUpdate(
        checkActivity._id,
        { $set: updateObj },
        { new: true }
      );
    } else {
      const newActivity = new ActivityTracker({
        user: req.user._id,
        date,
        activity,
        breaks,
        overtime,
        hours,
      });

      updateActivity = await newActivity.save();
    }

    return res.json({
      success: true,
      message: "Activity updated or saved",
      data: updateActivity,
    });
  } catch (error) {
    console.error("Error in postActivityHr:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// Not in use

export const getActivitiesByUser = asyncHandler(async (req, res) => {
  const { userId, page, perPage, year, month, date } = req.query;
  let and;

  if (!userId || userId === "" || userId === "undefined") {
    and = [{ user: req.user._id }];
  } else {
    and = [{ user: userId }];
  }

  if (date && date !== "undefined" && date !== "") {
    and.push({ date });
    const data = await ActivityTracker.find({ $and: and })
      .skip(Number(perPage) * Number(page))
      .limit(Number(perPage));

    return res.json({ success: true, data });
  }

  if (
    month &&
    month !== "undefined" &&
    month !== "" &&
    year &&
    year !== "undefined" &&
    year !== ""
  ) {
    const data =
      (await ActivityTracker.find({ $and: and }))
        .filter(
          (e) => e.date.split("/")[1] === month && e.date.split("/")[2] === year
        )
        .slice(
          Number(perPage) * Number(page),
          Number(perPage) * (Number(page) + 1)
        )
        .concat(perPage) *
      Number(page) +
      Number(perPage);

    return res.json({ success: true, data });
  }

  if (month && month !== "undefined" && month !== "") {
    const data = (await ActivityTracker.find({ $and: and }))
      .filter((e) => e.date.split("/")[1] === month)
      .slice(
        Number(perPage) * Number(page),
        Number(perPage) * (Number(page) + 1)
      );

    return res.json({ success: true, data });
  }

  if (year && year !== "undefined" && year !== "") {
    const data = (await ActivityTracker.find({ user: req.user._id }))
      .filter((e) => e.date.split("/")[2] === year)
      .slice(
        Number(perPage) * Number(page),
        Number(perPage) * (Number(page) + 1)
      );

    return res.json({ success: true, data });
  }

  const data = await ActivityTracker.find({ $and: and })
    .skip(Number(perPage) * Number(page))
    .limit(Number(perPage));

  return res.json({ success: true, data });
});

export const getStatisticsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  if (!userId || userId === "" || userId === "undefined") {
    userId = req.user._id;
  }

  const data = await ActivityTracker.find({ user: userId });
  const curr = new Date();
  const first = startOfWeek(curr);

  let weekHours = 0;
  let monthHours = 0;

  data.forEach((entry) => {
    const [day, month, year] = entry.date.split("/").map(Number);

    if (
      day >= first.getDate() ||
      month >= first.getMonth() + 1 ||
      year >= first.getFullYear()
    ) {
      weekHours += Number(entry.hours);
    }

    if (month >= first.getMonth() + 1 && year >= first.getFullYear()) {
      monthHours += Number(entry.hours);
    }
  });

  return res.json({ success: true, data: { weekHours, monthHours } });
});

function getLastDateOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getTotalWorkingDaysInMonth() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let totalWorkingDays = 0;

  for (let i = 1; i <= daysInMonth; i++) {
    const currentDate = new Date(year, month, i);
    if (currentDate.getDay() !== 0) {
      // Sunday has index 0
      totalWorkingDays++;
    }
  }

  return totalWorkingDays;
}

export const getAllActivities = asyncHandler(async (req, res) => {
  let { type, date, userId, month } = req.query;

  let and = [];

  if (type && type !== "" && type !== "undefined") {
    if (type === "daily") {
      if (date && date !== "" && date !== "undefined") {
        and.push({
          date1: `${date.split("-")[2]}/${date.split("-")[1]}/${date.split("-")[0]}`,
        });
      } else {
        const formattedDate = new Date().toLocaleDateString("en-GB");
        and.push({ date1: formattedDate });
      }
    } else if (type === "monthly") {
      if (userId && userId !== "" && userId !== "undefined") {
        let objectId = mongoose.Types.ObjectId(userId);
        and.push({ "user._id": objectId });
      }

      if (month && month !== "" && month !== "undefined") {
        // console.log(month);
        let thisMonth = new Date(`${month}-${1}`).getTime();
        let lastDate = getLastDateOfMonth(
          Number(month.split("-")[0]),
          Number(month.split("-")[1])
        );
        let thisMonth1 = new Date(`${month}-${lastDate}`).getTime();
        and.push({ date: { $gte: thisMonth, $lte: thisMonth1 } });
      } else {
        let d = new Date();
        let now = d.getTime();
        let thisMonth = new Date(
          `${d.getFullYear()}-${d.getMonth() + 1}-${1}`
        ).getTime();

        and.push({ date: { $gte: thisMonth, $lte: now } });
      }
    } else if (type === "all") {
      let obj = {};
      let workingDays = getTotalWorkingDaysInMonth();

      if (userId && userId !== "" && userId !== "undefined") {
        let objectId = mongoose.Types.ObjectId(userId);
        and.push({ "user._id": objectId });
      } else {
        and.push({});
      }
      const data = await ActivityTracker.find({ $and: and });
      for (let i of data) {
        if (!obj[i.user_id]) {
          let userId = i.user._id;
          let users = data.filter((x) => x.user._id === userId);
          // Number(item.total) > 21600
          let presentCount = users.filter((x) => Number(x.total) > 0).length;
          let absentCount = workingDays - presentCount;
          obj[i.user._id] = {
            user: i.user,
            workingDays,
            presentCount,
            absentCount,
          };
        }
      }

      return res
        .status(200)
        .json(new ApiResponse(200, obj, "successfully fetched all activities"));
    }
  } else {
    const formattedDate = new Date().toLocaleDateString("en-GB");
    and.push({ date1: formattedDate });
  }

  if (and.length === 0) {
    and.push({});
  }

  const data = await ActivityTracker.find({ $and: and });
  return res
    .status(200)
    .json(new ApiResponse(200, data, "successfully fetched all activities"));
});

export const deleteAllActivities = asyncHandler(async (req, res) => {
  await ActivityTracker.deleteMany({});
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "successfully deleted all Activities"));
});
*/