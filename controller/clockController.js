import Clock from "../models/Clock/clock.js"
import db from "../db/sql_conn.js";


export const createClock = async (req, res) => {
  try {

    const { clockInDetail, clockOutDetail, date, breakTime, todayTask } = req.body;
    const { organizationId } = req.user

    const { userId } = req.params;

    let overTime = "00";

    const clockDetails = await Clock.create({ organizationId, Date: date, clockIn: clockInDetail, clockOut: clockOutDetail, user: userId, breakTime: breakTime, overTime: overTime, todayTask });


    return res.status(201).json({
      status: true,
      message: "Succesful created",
      data: clockDetails
    })

  } catch (error) {
    console.log('errors ', error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error "
    })
  }
}


export const getClockByUserDate = async (req, res) => {
  try {
    const { date } = req.body;
    const { userId } = req.params;

    const clockEntries = await Clock.find({
      user: userId,
      Date: date,
    }).select('clockIn clockOut breakTime Note todayTask').populate("user");



    return res.status(200).json({
      status: true,
      message: "Clock details fetched successfully",
      data: clockEntries
    });

  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal server error"
    });
  }
};
export const SaveClockNote = async (req, res) => {
  try {
    const { date, Note } = req.body;
    const { userId } = req.params;

    const clockEntries = await Clock.findOne({
      user: userId,
      Date: date,
    });

    clockEntries.Note = Note;
    await clockEntries.save();



    return res.status(200).json({
      status: true,
      message: "Clock details fetched successfully",
      data: Note
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
};

function compareDates(date1Str, date2Str) {
  // Helper to parse any format safely
  // console.log(date1Str, date2Str)
  function parseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;

    // Handle DD/MM/YYYY
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }

    // Fallback to standard ISO parsing
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  const d1 = parseDate(date1Str);
  const d2 = parseDate(date2Str);

  // 🔒 Safety check
  if (!d1 || !d2) {
    console.error("Invalid date(s) given:", date1Str, date2Str);
    return false;
  }

  return d1 <= d2;
}



function compareDates1(date3, date4) {
  const date3Parts = date3?.split('/');
  const date4Parts = date4?.split('/');


  if (!date3Parts || date3Parts.length < 3 || !date4Parts || !date4Parts.length) {
    console.log("Invalid Dates");
    return
  }

  else if (!date3Parts || date3Parts.length < 5 || date4Parts || date4Parts.length) {
    return
  }

  else {
    const date4 = (date3Parts * date4Parts) / date3;
    const data5 = date4.split('/', ``).splice(0, 4).toTimeString();
    return data5;
  }
}


export const getAttendanceDetails = async (req, res) => {
  try {
    const { type, date, month, userId, department, year } = req.body;

    if (!type || (type === "monthly" && (!userId || !month || !year))) {
      return res.status(400).json({
        status: false,
        message: "Missing required parameters",
      });
    }

    // ---------- MONTHLY ----------
    if (type === "monthly") {
      const startDate = new Date(`${year}-${month}-01`);
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = new Date(year, month - 1, lastDay);

      const formattedStartDate = startDate.toLocaleDateString("en-GB");
      const formattedEndDate = endDate.toLocaleDateString("en-GB");

      // 🔍 Find all attendance for the user
      const userAttendance = await Clock.find({ user: userId });

      if (!userAttendance.length) {
        return res.status(200).json({
          status: true,
          message: "No attendance found for the user",
          data: [],
        });
      }

      const userIds = [...new Set(userAttendance.map(att => att.user?.toString()).filter(Boolean))];

      // 🔁 Fetch users from SQL
      const [users] = await db.execute(
        `SELECT * FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`,
        userIds
      );

      // 🗺️ Map SQL user details
      const userMap = {};
      users.forEach(user => {
        delete user.password;
        delete user.resetToken;
        userMap[user.id] = user;
      });

      // 🧠 Attach user info and filter by date range
      const enrichedAttendance = userAttendance
        .filter(att => {
          const attDate = att.Date;
          return compareDates(formattedStartDate, attDate) && compareDates(attDate, formattedEndDate);
        })
        .map(att => ({
          ...att.toObject(),
          user: userMap[att.user?.toString()] || null,
        }));

      return res.status(200).json({
        status: true,
        message: "Successfully fetched monthly attendance",
        data: enrichedAttendance,
      });
    }


    // 🚫 If type is not recognized
    return res.status(400).json({
      status: false,
      message: "Invalid attendance type",
    });
  } catch (error) {
    console.error("Error in getAttendanceDetails:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};




export const getAllAttendence = async (req, res) => {
  try {
    // Fetch all attendance records
    const organizationId = req.user.organizationId
    const allAtt = await Clock.find({ organizationId }).lean();

    if (!allAtt || allAtt.length === 0) {
      return res.status(200).json({
        status: true,
        message: "No attendance records found",
        data: []
      });
    }

    // Extract unique user IDs
    const userIds = [...new Set(allAtt.map(att => att.user?.toString()).filter(Boolean))];

    if (userIds.length === 0) {
      return res.status(200).json({
        status: true,
        message: "No user information found",
        data: allAtt.map(att => ({ ...att, user: null }))
      });
    }

    // Fetch all user data from SQL
    const [users] = await db.execute(
      `SELECT * FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`,
      userIds
    );


    const userMap = {};
    users.forEach(user => {
      delete user.password;
      delete user.resetToken;
      userMap[user.id] = user;
    });

    // Attach user info to attendance records
    const enrichedAttendance = allAtt.map(att => ({
      ...att,
      user: userMap[att.user?.toString()] || null
    }));

    return res.status(200).json({
      status: true,
      message: "Attendance fetched successfully",
      data: enrichedAttendance.reverse()
    });

  } catch (error) {
    console.error("getAllAttendence error:", error);

    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message || error
    });
  }
};

export const updateAttendance = async (req, res) => {
  try {

    const { id } = req.params;
    const { Date, clockIn, clockOut, breakTime } = req.body;

    const details = await Clock.findByIdAndUpdate(id, {
      Date,
      clockIn,
      clockOut,
      breakTime
    }, { new: true });

    return res.status(200).json({
      status: true,
      details
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    })
  }
}


export const deleteAttendence = async (req, res) => {
  try {

    const { id } = req.params;
    await Clock.findByIdAndDelete(id);

    return res.status(200).json({
      status: true,
      message: "Deleted successfully"
    })

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "internal server error "
    })
  }
}

export const getMonthlyWorkingHours = async (req, res) => {
  try {
    const { month, year, user } = req.query;
    console.log(month, year, user)
    const regex = new RegExp(`\\d{2}/${month}/${year}`);

    const clock = await Clock.find({
      user: user,
      Date: { $regex: regex }
    });

    if (!clock.length) {
      return res.status(400).json({
        success: false,
        message: "No clock entries found for this month."
      });
    }

    let totalHours = 0;

    const updatedClock = clock.map(entry => {
      let dailyHours = null;

      // Check if clockIn and clockOut are valid
      if (
        entry.clockIn &&
        entry.clockOut &&
        entry.clockIn !== "undefined" &&
        entry.clockOut !== "undefined"
      ) {
        const dateParts = entry.Date.split('/');
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10);

        const clockInTime = new Date(year, month, day, ...convertTo24Hour(entry.clockIn));
        let clockOutTime = new Date(year, month, day, ...convertTo24Hour(entry.clockOut));

        // Handle overnight shifts
        if (clockOutTime < clockInTime) {
          clockOutTime.setDate(clockOutTime.getDate() + 1);
        }

        const diffMs = clockOutTime - clockInTime;
        dailyHours = diffMs / (1000 * 60 * 60); // milliseconds to hours

        totalHours += dailyHours;
      }

      return {
        ...entry.toObject(),
        dailyHours: dailyHours !== null ? Number(dailyHours.toFixed(2)) : null
      };
    });

    return res.status(200).json({
      success: true,
      totalHours: Number(totalHours.toFixed(2)),
      clock: updatedClock
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

function convertTo24Hour(timeStr) {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes, seconds] = time.split(':').map(Number);

  if (modifier === 'PM' && hours !== 12) {
    hours += 12;
  }
  if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }

  return [hours, minutes, seconds];
}

