import Task from "../models/taskModel.js";
import Meet from "../models/MeetingModel.js"
import { SendEmail } from "../utils/SendEmail.js";
import User from "../models/User/User.js";
import Notification from "../models/Notification/Notification.js"
import LeadTimeline from "../models/LeadTimeline.js";



export const CreateTask = async (req, res) => {

  const { LeadName, FollowUpType, Date, Time, Remark, LeadId, userId } = req.body;

  const taskDetail = await Task.create({ LeadName, FollowUpType, Date, Time, Remark, LeadId, user: userId });

  const newNotification = await Notification.create({ title: "New Remark", description: `Remark from ${LeadName}`, user: userId });
  const leadTimeline = await LeadTimeline.create({
    leadId: LeadId,
    action: `FollowUpType updated to ${FollowUpType}`,
    createdBy: req.user?.fullName || "System"
  });
  console.log(leadTimeline._id)


  return res.status(200).json({
    status: true,
    message: "Successfuly done",
    taskDetail
  })

}

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

  const { title, meetDateFrom, MeetingLink, meetDateTo, Status, meetTimeFrom, meetTimeTo, Host, RelatedTo, Participant, Note, userId, LeadId } = req.body;


  const meetDetail = await Meet.create({ title, meetDateFrom, meetDateTo, Status, meetTimeFrom, meetTimeTo, Host, RelatedTo, Participant, Note, user: userId, LeadId, MeetingLink });

  const leadTimeline = await LeadTimeline.create({
    leadId: LeadId,
    action: `Meeting Created`,
    createdBy: req.user?.fullName || "System"
  });
  console.log(leadTimeline._id)
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