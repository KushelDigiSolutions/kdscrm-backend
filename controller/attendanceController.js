import ActivityTracker from "../models/ActivityTracker/ActivityTracker.js";
import Holiday from "../models/Holiday/Holiday.js";
import User from "../models/User/User.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const daysInMonth = (month, year) => {
  return new Date(year, month, 0).getDate();
};

export const getAttendance = asyncHandler(async (req, res) => {
  let admin;
  if (req.user.role === "HR") {
    admin = req.user.adminId;
  } else if (req.user.role === "ADMIN") {
    admin = req.user._id;
  }

  const date = new Date().getDate();
  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  var d = new Date();
  var getTot = daysInMonth(d.getMonth(), d.getFullYear()); // Get total days in a month

  let holidays = await (
    await Holiday.find({ admin })
  ).map((e) => {
    if (
      Number(e.holidayDate.split("-")[1]) === month + 1 &&
      Number(e.holidayDate.split("-")[0]) === year
    ) {
      return Number(e.holidayDate.split("-")[2]);
    }
  });
  holidays = holidays.filter((e) => e !== undefined);

  for (var i = 1; i <= getTot; i++) {
    // Looping through days in the month
    var newDate = new Date(d.getFullYear(), d.getMonth(), i);
    if (newDate.getDay() === 0 && !holidays.includes(i)) {
      // If Sunday
      holidays.push(i);
    }
  }

  let employees;

  if (req.user.role === "HR") {
    employees = Array.from(await User.find({ Hr: req.user._id }));
  } else if (req.user.role === "ADMIN") {
    employees = Array.from(await User.find({ adminId: req.user._id }));
  }
  if (!employees) {
    employees = []; // Set employees to an empty array if no results
  }

  let answer = [];

  for (let i of employees) {
    let data = Array.from(await ActivityTracker.find({ user: i._id })).map(
      (e) => {
        if (
          Number(e.date.split("/")[1]) === month + 1 &&
          Number(e.date.split("/")[2]) === year
        ) {
          return e.date.split("/")[0];
        }
      }
    );
    data = data.filter((e) => e !== undefined);
    let status = "";
    if (data.includes(date)) {
      status = "P";
    } else {
      status = "A";
    }

    let totalPresent = data?.length || 0;
    let workingDays = holidays.filter((x) => x <= date).length;
    workingDays = date - workingDays;
    let totalAbsent = workingDays - totalPresent;

    answer.push({
      user: i,
      totalAbsent,
      totalPresent,
      status,
    });
  }
  return res.json({
    success: true,
    data: answer,
  });
});

export const getAttendanceByUser = asyncHandler(async (req, res) => {
  try {
    const { perPage, page, year, month, date, userId } = req.query;
    /* 
     loop through all the dates in the month and check if month date comes in activity tracker and not holiday/sunday, if yes then do according to it. if not then mark as absent
     */

    // Month cannot be alone, year cannot be alone

    let d = new Date();
    let monthArr = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    let ans = [];

    let admin;
    if (req.user.role === "ADMIN") {
      admin = req.user._id;
    } else {
      admin = req.user.adminId;
    }

    let and = [{ user: userId }];
    if (date && date !== "undefined" && date !== "") {
      let d2 = date.split("-");
      and.push({ date: `${d2[2]}/${d2[1]}/${d2[0]}` });

      let days1 = daysInMonth(d2[1], d2[0]);

      let holidays = await (
        await Holiday.find({ admin })
      ).map((e) => {
        if (
          Number(e.holidayDate.split("-")[1]) === d.getMonth() + 1 &&
          Number(e.holidayDate.split("-")[0]) === d.getFullYear()
        ) {
          return Number(e.holidayDate.split("-")[2]);
        }
      });
      holidays = holidays.filter((e) => e !== undefined);

      for (var i = 1; i <= days1; i++) {
        //looping through days in month
        var newDate = new Date(d.getFullYear(), d.getMonth(), i);
        if (newDate.getDay() === 0 && !holidays.includes(i)) {
          //if Sunday
          holidays.push(i);
        }
      }

      let activities = await ActivityTracker.find({ $and: and });
      if (activities && activities.length > 0) {
        // present
        ans.push({
          date: `${d2[2]} ${d2[1]} ${d2[0]}`,
          isHoliday: false,
          isAbsent: false,
          punchIn: activities[0].activity[0]?.ts,
          punchOut:
            activities[0].activity[activities[0]?.activity.length - 1].ts,
          hours: activities[0].hours,
          breaks: activities[0].breaks,
          overtime: activities[0].overtime,
        });
      } else {
        if (holidays.includes(d2[2])) {
          // holiday
          ans.push({
            date: `${d2[2]} ${d2[1]} ${d2[0]}`,
            isHoliday: true,
            isAbsent: false,
          });
        } else {
          // absent
          ans.push({
            date: `${d2[2]} ${d2[1]} ${d2[0]}`,
            isHoliday: false,
            isAbsent: true,
          });
        }
      }

      let totalPresent = activities?.length || 0;
      let workingDays = holidays.filter((x) => x <= d.getDate()).length;
      workingDays = d.getDate() - workingDays;
      let totalAbsent = workingDays - totalPresent;

      return { success: true, data: ans, totalPresent, totalAbsent };
    }

    if (
      month &&
      month !== "undefined" &&
      month !== "" &&
      year &&
      year !== "undefined" &&
      year !== ""
    ) {
      let days1 = daysInMonth(month, year);
      let last = perPage * (page + 1);

      let isLast = false;
      if (days1 <= last) {
        last = days1;
        isLast = true;
      }

      let holidays = await (
        await Holiday.find({ admin })
      ).map((e) => {
        if (
          Number(e.holidayDate.split("-")[1]) === month &&
          Number(e.holidayDate.split("-")[0]) === year
        ) {
          return Number(e.holidayDate.split("-")[2]);
        }
      });
      holidays = holidays.filter((e) => e !== undefined);

      for (var i = 1; i <= days1; i++) {
        //looping through days in month
        var newDate = new Date(d.getFullYear(), d.getMonth(), i);
        if (newDate.getDay() === 0 && !holidays.includes(i)) {
          //if Sunday
          holidays.push(i);
        }
      }

      let activities = (await ActivityTracker.find({ $and: and }))
        .filter((e) => {
          return (
            e.date.split("/")[1] === month && e.date.split("/")[2] === year
          );
        })
        .slice(perPage * page, perPage * (page + 1));

      for (let i = perPage * page + 1; i <= last; i++) {
        let f = activities.find((x) => Number(x.date.split("/")[0]) === i);
        if (f) {
          //present
          ans.push({
            date: `${i} ${monthArr[month - 1]} ${year}`,
            isHoliday: false,
            isAbsent: false,
            punchIn: f.activity[0].ts,
            punchOut: f.activity[f.activity.length - 1].ts,
            hours: f.hours,
            breaks: f.breaks,
            overtime: f.overtime,
          });
        } else {
          // if holiday or sunday
          if (holidays.includes(i)) {
            ans.push({
              date: `${i} ${monthArr[month - 1]} ${year}`,
              isHoliday: true,
              isAbsent: false,
            });
          } else {
            //absent
            ans.push({
              date: `${i} ${monthArr[month - 1]} ${year}`,
              isHoliday: false,
              isAbsent: true,
            });
          }
        }
      }

      let totalPresent = activities?.length || 0;
      let workingDays = holidays.filter((x) => x <= d.getDate()).length;
      workingDays = d.getDate() - workingDays;
      let totalAbsent = workingDays - totalPresent;

      return { success: true, data: ans, totalPresent, totalAbsent, isLast };
    }

    // if (year && year !== 'undefined' && year !== '') {
    //     // let data = (await ActivityTracker.find({ user: auth._id })).filter((e) => {
    //     //     return e.date.split("/")[2] === year;
    //     // }).slice(perPage * page, perPage * (page + 1));

    //     let days1 = 365;
    //     let last = (perPage * (page + 1));

    //     let isLast = false;
    //     if (days1 <= last) {
    //         last = days1;
    //         isLast = true;
    //     }

    //     let holidays = await (await Holiday.find({ admin })).map((e) => {
    //         if (Number(e.holidayDate.split("-")[0]) === year) {
    //             return Number(e.holidayDate.split("-")[2]);
    //         }
    //     });
    //     holidays = holidays.filter(e => e !== undefined);

    //     for (var i = 1; i <= days1; i++) {    //looping through days in month
    //         var newDate = new Date(d.getFullYear(), d.getMonth(), i);
    //         if (newDate.getDay() === 0 && !holidays.includes(i)) {   //if Sunday
    //             holidays.push(i);
    //         }
    //     }

    //     let activities = (await ActivityTracker.find({ $and: and })).filter((e) => {
    //         return e.date.split("/")[2] === year;
    //     }).slice(perPage * page, perPage * (page + 1));

    //     for (let i = (perPage * page) + 1; i <= last; i++) {
    //         let f = activities.find(x => Number(x.date.split("/")[0]) === i);
    //         if (f) {
    //             //present
    //             ans.push({
    //                 date: `${i} ${monthArr[month - 1]} ${year}`,
    //                 isHoliday: false,
    //                 isAbsent: false,
    //                 punchIn: f.activity[0].ts,
    //                 punchOut: f.activity[f.activity.length - 1].ts,
    //                 hours: f.hours,
    //                 breaks: f.breaks,
    //                 overtime: f.overtime
    //             });
    //         }
    //         else {
    //             // if holiday or sunday
    //             if (holidays.includes(i)) {
    //                 ans.push({
    //                     date: `${i} ${monthArr[month - 1]} ${year}`,
    //                     isHoliday: true,
    //                     isAbsent: false
    //                 });
    //             }
    //             else {
    //                 //absent
    //                 ans.push({
    //                     date: `${i} ${monthArr[month - 1]} ${year}`,
    //                     isHoliday: false,
    //                     isAbsent: true
    //                 });
    //             }
    //         }
    //     }

    //     return { success: true, data: ans };
    // }

    // console.log(and);

    let month1 = d.getMonth();
    let year1 = d.getFullYear();
    let days1 = daysInMonth(month1 + 1, year1);
    let last = perPage * (page + 1);

    let isLast = false;
    if (days1 <= last) {
      last = days1;
      isLast = true;
    }

    let holidays = await (
      await Holiday.find({ admin })
    ).map((e) => {
      if (
        Number(e.holidayDate.split("-")[1]) === month1 + 1 &&
        Number(e.holidayDate.split("-")[0]) === year1
      ) {
        return Number(e.holidayDate.split("-")[2]);
      }
    });
    holidays = holidays.filter((e) => e !== undefined);

    for (var i = 1; i <= days1; i++) {
      //looping through days in month
      var newDate = new Date(d.getFullYear(), d.getMonth(), i);
      if (newDate.getDay() === 0 && !holidays.includes(i)) {
        //if Sunday
        holidays.push(i);
      }
    }

    let activities = (await ActivityTracker.find({ $and: and })).filter((e) => {
      return (
        e.date.split("/")[1] === month1 + 1 && e.date.split("/")[2] === year1
      );
    });

    for (let i = perPage * page + 1; i <= last; i++) {
      let f = activities.find((x) => Number(x.date.split("/")[0]) === i);
      if (f) {
        //present
        ans.push({
          date: `${i} ${monthArr[month1]} ${year1}`,
          isHoliday: false,
          isAbsent: false,
          punchIn: f.activity[0].ts,
          punchOut: f.activity[f.activity.length - 1].ts,
          hours: f.hours,
          breaks: f.breaks,
          overtime: f.overtime,
        });
      } else {
        // if holiday or sunday
        if (holidays.includes(i)) {
          ans.push({
            date: `${i} ${monthArr[month1]} ${year1}`,
            isHoliday: true,
            isAbsent: false,
          });
        } else {
          //absent
          ans.push({
            date: `${i} ${monthArr[month1]} ${year1}`,
            isHoliday: false,
            isAbsent: true,
          });
        }
      }
    }

    let totalPresent = activities?.length || 0;
    let workingDays = holidays.filter((x) => x <= d.getDate()).length;
    workingDays = d.getDate() - workingDays;
    let totalAbsent = workingDays - totalPresent;

    return { success: true, data: ans, totalPresent, totalAbsent, isLast };
  } catch (error) {
    console.log("error is ", error.message);
  }
});

