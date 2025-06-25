import Task from "../models/taskModel.js";
import Meet from "../models/MeetingModel.js"
import { SendEmail } from "../utils/SendEmail.js";
import User from "../models/User/User.js";
import Notification from "../models/Notification/Notification.js"
import LeadTimeline from "../models/LeadTimeline.js";



export const CreateTask = async (req, res) => {
  try {
    const { LeadName, FollowUpType, Date, Time, Remark, LeadId } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    if (!LeadName || !FollowUpType || !Date || !Time || !LeadId || !userId || !organizationId) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields",
      });
    }

    // Create Task
    const taskDetail = await Task.create({
      LeadName,
      FollowUpType,
      Date,
      Time,
      Remark,
      LeadId,
      user: userId,
      organizationId, // if Task schema needs it
    });

    // Create Notification
    const newNotification = await Notification.create({
      title: "New Remark",
      description: `Remark from ${LeadName}`,
      user: userId,
      organizationId, // ✅ FIXED here
    });

    // Add to Lead Timeline
    const leadTimeline = await LeadTimeline.create({
      leadId: LeadId,
      action: `Follow-up type updated to ${FollowUpType}`,
      createdBy: req.user.fullName || "System",
      organizationId, // ✅ Optional: if required by schema
    });

    console.log("Lead Timeline ID:", leadTimeline._id);

    return res.status(200).json({
      status: true,
      message: "Successfully created task, notification, and timeline",
      taskDetail,
    });

  } catch (error) {
    console.error("CreateTask Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const EditTask = async (req, res) => {

  const { LeadName, FollowUpType, Date, Time, Remark, LeadId } = req.body;

  const { taskId } = req.params;

  const taskDetail = await Task.findByIdAndUpdate(taskId, { LeadName, FollowUpType, Date, Time, Remark, LeadId }, { new: true });

  return res.status(200).json({
    status: true,
    message: "Successfuly done",
    taskDetail
  })

}

export const DeleteTask = async (req, res) => {

  const { taskId } = req.params;

  const taskDetail = await Task.findByIdAndDelete(taskId);

  return res.status(200).json({
    status: true,
    message: "Successfuly "
  })

}

export const CreateMeet = async (req, res) => {
  try {
    const {
      title, meetDateFrom, meetDateTo, Status,
      meetTimeFrom, meetTimeTo, Host,
      RelatedTo, Participant, Note, userId, LeadId, MeetingLink
    } = req.body;

    // 1. Save meeting details
    const meetDetail = await Meet.create({
      title, meetDateFrom, meetDateTo, Status,
      meetTimeFrom, meetTimeTo, Host,
      RelatedTo, Participant, Note,
      user: userId, LeadId, MeetingLink
    });

    // 2. Add to timeline
    await LeadTimeline.create({
      leadId: LeadId,
      action: "Meeting Created",
      createdBy: req.user?.fullName || "System"
    });

    // 3. Prepare email content
    const emailList = Participant.split(',').map(email => email.trim());
    const message = `Meeting Link: ${MeetingLink}`;
    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #4a90e2; color: white; padding: 16px 24px; text-align: center;">
            <h2 style="margin: 0;">Meeting Details</h2>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 16px; margin: 0 0 12px;"><strong>📌 Meeting Link:</strong> <a href="${MeetingLink}" style="color: #4a90e2;">${MeetingLink}</a></p>
            <p style="font-size: 16px; margin: 0 0 12px;"><strong>🔗 Related To:</strong> ${RelatedTo}</p>
            <p style="font-size: 16px; margin: 0;"><strong>📝 Note:</strong> ${Note}</p>
          </div>
          <div style="background-color: #f0f0f0; padding: 12px 24px; text-align: center; font-size: 14px; color: #777;">
            Please join on time. Thank you!
          </div>
        </div>
      </div>
    `;

    // 4. Send emails in parallel with Promise.all
    const emailPromises = emailList.map(email =>
      SendEmail(email, "Meeting Detail", message, html)
    );

    await Promise.allSettled(emailPromises); // use .settled to avoid failing on one error

    // 5. Final response
    return res.status(200).json({
      status: true,
      message: "Meeting created and emails sent",
      meetDetail
    });

  } catch (error) {
    console.error("CreateMeet Error:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: error.message
    });
  }
};

export const EditMeet = async (req, res) => {

  const { title, meetDateFrom, MeetingLink, meetDateTo, Status, meetTimeFrom, meetTimeTo, Host, RelatedTo, Participant, Note, LeadId } = req.body;

  const { meetId } = req.params;

  const meetDetail = await Meet.findByIdAndUpdate(meetId, { title, meetDateFrom, meetDateTo, Status, meetTimeFrom, meetTimeTo, Host, RelatedTo, Participant, Note, LeadId, MeetingLink }, { new: true });

  const emailList = Participant.split(',').map(email => email.trim());

  const message = `<div>
    <div>Meeting Link: ${MeetingLink}</div>
    </div>
    `;
  const html = `
    <div>
    <div>Meeting Link: ${MeetingLink}</div>
      <div>Related To:${RelatedTo}</div>
      <div>Note :${Note}</div>
    </div>
  `;

  // Send email to each participant
  for (const email of emailList) {
    await SendEmail(email, "Meeting Detail", message, html); // Assuming message and html are defined
  }


  return res.status(200).json({
    status: true,
    message: "Successfuly done",
    meetDetail
  })


}

export const DeleteMeet = async (req, res) => {
  const { meetId } = req.params;

  const meetDetail = await Meet.findByIdAndDelete(meetId);

  return res.status(200).json({
    status: true,
    message: "Successfuly "
  })
}

export const GetTaskByUser = async (req, res) => {
  const { userId } = req.params;

  const allTask = await Task.find({ user: userId }).populate("user");

  return res.status(200).json({
    status: true,
    allTask
  })
}

export const GetMeetByUser = async (req, res) => {
  const { userId } = req.params;

  const allMeet = await Meet.find({ user: userId }).populate("user");

  return res.status(200).json({
    status: true,
    allMeet
  })
}

export const FetchFollow = async (req, res) => {
  const { id } = req.params;

  const data = await Task.find({ LeadId: id });

  return res.status(200).json({
    status: true,
    data
  })

}

export const role = async (req, res) => {
  const { id } = req.params;
  const data = await User.find({ designation });
  return ({
    data: data,
    message: "designation fetched successfully",
    status: true
  })
}

export const module = async (req, res) => {
  const { id } = req.params;
  console.log(id);
  const data1 = await User.find({ department });

  return ({
    data: data1,
    message: "module is fetched successfully",
    status: true
  })
}
export const FetchAllTask = async (req, res) => {
  const allTask = await Task.find({}).sort({ date: -1 });
  console.log("ss", allTask);
  return res.status(200).json({
    status: true,
    message: "All task fetch",
    data: allTask
  })
}