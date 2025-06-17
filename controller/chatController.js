// import Chat, { find, findById, findByIdAndUpdate, findByIdAndDelete, deleteMany } from "../models/Chat/Chat.js";
import User from "../models/User/User.js";
import Chat from "../models/Chat/Chat.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getChats = asyncHandler(async (req, res) => {
  const data = await Chat.find({ users: { $elemMatch: { id: req.user._id } } });
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Successfully fetched all the chats"));
});

export const getChat = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = await Chat.findById(id);

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Successfully feteched the chat"));
});

export const getChatByUser = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const data = await Chat.find({
    $and: [
      { users: { $elemMatch: { id: req.user._id } } },
      { users: { $elemMatch: { id: userId } } },
    ],
  });
  return res
    .status(200)
    .json(
      new ApiResponse(200, data, "Successfully feteched the chats by user")
    );
});

export const getAllChats = asyncHandler(async (req, res) => {
  const data = await Chat.find();
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Successfully feteched all chats"));
});

export const createNewChat = asyncHandler(async (req, res) => {
  const { user, message } = req.body;
  try {
    const newChat = await Chat.create({
      users: [
        {
          id: req.user._id,
          name: req.user.fullName,
          role: req.user.role,
          email: req.user.email,
          mobile: req.user.mobile,
          designation: req.user.designation,
        },
        {
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email,
          mobile: user.mobile,
          designation: user.designation,
        },
      ],
      messages: [
        {
          text: message.text,
          user: {
            id: req.user._id,
            name: req.user.fullName,
            role: req.user.role,
            email: req.user.email,
            mobile: req.user.mobile,
            designation: req.user.designation,
          },
          isNewMessage: true,
          ts: new Date().getTime(),
        },
      ],
    });

    return res
      .status(200)
      .json(new ApiResponse(200, newChat, "Chat Created successfully"));
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export const postMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!id || !message) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid input parameters"));
  }

  try {
    
    let prevData = await Chat.findById(id);

  
    if (!prevData) {
      return res.status(404).json(new ApiResponse(404, null, "Chat not found"));
    }

    let tFlag = true;
    const date = new Date();
    const d1 = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      100
    ).getTime();

    
    if (!prevData.messages) {
      prevData.messages = [];
    }

    if (prevData.messages.length > 0 && prevData.messages[prevData.messages.length - 1].ts < d1) {
      tFlag = false;
    }

    let messageArr = prevData.messages.concat({
      text: message.text,
      user: {
        name: req.user.fullName,
        id: req.user._id,
      },
      isNewMessage: tFlag,
      ts: Date.now(),
    });

    const data = await Chat.findByIdAndUpdate(
      id,
      { $set: { messages: messageArr } },
      { new: true }
    );

    return res.status(200).json(new ApiResponse(200, data, "Message Sent!"));
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error"));
  }
});

export const deleteChat = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Chat.findByIdAndDelete(id);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Chat Deleted Successfully"));
});

export const deleteChats = asyncHandler(async (req, res) => {
  await Chat.deleteMany();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Chats Deleted Successfully"));
});

export const postChat = asyncHandler(async(req,res)=>{
    const {name,chatDetails} = req.body;
    
    const chatUser = await Chat.create({
      name,chatDetails,user:User?._id,
      User: req.params.id,
      message: req.user.message
    });

    console.log(chatUser);

    return({status:false, data:chatUser, message:"successfully created all the chats"})
    
})
