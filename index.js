import express from "express";
const app = express();
import { createTransport } from "nodemailer";
import cors from "cors";
import userRouter from "./router/userRouter.js";
import payrollRouter from "./router/payrollRouter.js";
import openActivity from "./router/openActivity.js"
import hrRouter from "./router/hrRouter.js";
import activityRouter from "./router/activityRouter.js";
import leaveRouter from "./router/leaveRouter.js";
import totalLeaveRouter from "./router/totaLeaveRouter.js";
import adminRouter from "./router/adminRouter.js";
import verifyRouter from "./router/verifyRouter.js";
import projectRouter from "./router/projectRouter.js";
import holidayRouter from "./router/holidayRouter.js";
import taskRouter from "./router/taskRouter.js";
import chatRouter from "./router/chatRouter.js";
import notification from "./router/notification.js"
import clock from "./router/clockRouter.js"
import award from "./router/awardRouter.js"
import lead from "./router/leadRouter.js"
import ProjectRoute from "./router/ProjectRoutes.js"
import LeadRoute from "./router/leadManageRouter.js"

import attendanceRouter from "./router/attendanceRouter.js";
import authRouter from "./router/authRouter.js";
import systemRouter from "./router/systemRouter.js";
// import apprisalRouter from "./router/apprisalRouter.js"
// import indicatorRouter from "./router/indicatorRouter.js";
import { connectDb } from "./db/user_conn.js";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";

import cron from 'node-cron';

import dotenv from "dotenv";
import User from "./models/User/User.js";
import ActivityTracker from "./models/ActivityTracker/ActivityTracker.js";
import payslip from "./router/paySlipRouter.js";
import PermissionRouter from "./router/PermissionRouter.js";
// import Trainer from "./models/Trainer/Trainer.js";
import errorHandler from "./middleware/errorHandler.js";
import sqlRouter from "./router/sql.js"
import googleCalender from "./router/integrations/googleCalender.js"
import whatsappIntegration from "./router/integrations/whatsappIntegration.js"
import proRoute from "./router/integrations/proRoute.js"


dotenv.config();
const port = process.env.PORT;

//Database Connection
connectDb();

// app.use(
//   cors({
//     origin: process.env.ORIGIN_URL,
//     credentials: true,
//     methods: ["get", "post", "delete", "put"],
//   })
// );
app.use(cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

app.use(cookieParser());

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp"
  })
)


app.use("/user", userRouter);
app.use("/hr", hrRouter);
app.use("/activity", activityRouter);
app.use("/leave", leaveRouter);
app.use("/totalLeave", totalLeaveRouter);
app.use("/admin", adminRouter);
app.use("/verify", verifyRouter);
app.use("/project", projectRouter);
app.use("/holiday", holidayRouter);
app.use("/task", taskRouter);
app.use("/chat", chatRouter);
app.use("/notification", notification);
app.use("/clock", clock);
app.use("/award", award);
app.use("/lead", lead);
app.use("/lead", LeadRoute)
app.use("/payroll", payrollRouter);
app.use("/openActivity", openActivity);

app.use("/attendance", attendanceRouter);
app.use("/auth", authRouter);
app.use("/system", systemRouter);
app.use("/payslip", payslip);
app.use("/api", sqlRouter)
app.use("/permission", PermissionRouter);

app.use("/latest_project", ProjectRoute)
app.use("/api", googleCalender);
app.use("/api", whatsappIntegration);
app.use("/api", proRoute);

const task = cron.schedule('55 23 * * *', async () => {

  let users = await User.find({ role: { $ne: "ADMIN" } });
  let todayDate = new Date().toLocaleDateString('en-GB');
  let todayAttendances = await ActivityTracker.find({ date1: todayDate }, { 'user._id': 1, _id: 0 });

  let arr = [];
  for (let i of todayAttendances) {
    if (!arr.includes(i.user._id)) {
      arr.push(i.user._id);
    }
  }
  let absentUsers = users.filter(x => !arr.includes(x._id));

  let arr1 = [];
  let date = new Date().getTime();
  for (let i of absentUsers) {
    arr1.push({
      user: i, date, date1: todayDate, clockIn: 0, clockOut: 0, late: 0, overtime: 0, total: 0, message: ''
    });
  }
  await ActivityTracker.insertMany(arr1, { ordered: false });
}, {
  scheduled: true,
  timezone: 'Asia/Kolkata'
});

app.post("/email-settings/test", async (req, res) => {
  try {
    const { to, subject, text, host, port, secure, user, pass, from } = req.body;
    const transporter = createTransport({
      host: host,
      port: port,
      secure: secure,
      auth: {
        user: user,
        pass: pass
      },
      from: from,
      tls: {
        rejectUnauthorized: false,
      },
    });
    await transporter.sendMail({
      from: from, // ✅ Use value from req.body
      to,
      subject,
      text,
      html: `<div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
  <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 30px;">
    <h1 style="color: #333333; font-size: 24px; margin-bottom: 20px;">This is a test email</h1>
    <p style="color: #555555; font-size: 16px; line-height: 1.6;">
      Sent via <strong>HRMS</strong> with custom config.
    </p>
  </div>
</div>`,
    });

    res.status(200).json({
      status: true,
      message: "Test mail sent successfully.",
    });
  } catch (error) {
    console.error("Mail Error:", error);
    let userMessage = "Failed to send test mail.";
    if (error.code === "EAUTH") {
      userMessage = "Authentication failed. Please check your email username or password.";
    } else if (error.code === "ECONNECTION") {
      userMessage = "Connection failed. Please check your SMTP host and port.";
    } else if (error.code === "ENOTFOUND") {
      userMessage = "SMTP server not found. Please verify the host address.";
    } else if (error.response && error.response.includes("Invalid recipient")) {
      userMessage = "Invalid recipient email address.";
    } else if (error.message.includes("self signed certificate")) {
      userMessage = "SSL certificate issue. Try using TLS or set encryption properly.";
    }
  }
});

task.start();

app.get("/", (req, res) => {
  res.send("hello world");
});
app.use(errorHandler)

app.listen(port, () => {

  console.log(`Listening on http://localhost:${port}`)
});

