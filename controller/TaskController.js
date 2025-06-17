import Task from "../models/Task/Task.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

export const postTask = asyncHandler(async (req, res) => {
  const { name, time } = req.body;
  console.log(req.body);
  const newTask = await Task.create({
    name,
    time,
    admin: req.user.adminId,
    user: req.user._id,
    ts: new Date().getTime(),
    status: "false",
  });
  return res
    .status(200)
    .json(new ApiResponse(200, newTask, " successfully posted"));
});

export const updateTask = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const updateuserTask = await Task.findByIdAndUpdate(
    id,
    {
      $set: { status },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updateuserTask, "Updated  Successfully"));
});

export const getTasks = asyncHandler(async (req, res) => {
  const data = await Task.find({
    [req.user.role === "ADMIN" ? "admin" : "user"]: req.user._id,
  });

  console.log(data);
  
  return res
    .status(200)
    .json(new ApiResponse(200, data, "task fetched Successfully"));
});

export const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const data = await Task.findByIdAndDelete(id);
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Deleted   Successfully"));
});


// ===================task notes api========================
export const createNote = asyncHandler(async(req,res) => {
   try {
      const {Note} = req.body;

      const notes = Task.create({Note:Note, noteDate: Date.now(), user:req.user._id, admin: req.user.adminId,});

      return res.status(200).json({
        status: true,
        message: "Successfuly created Note",
        data: notes
    })
   } 
   catch (error) {
      console.log(error);
   }
});



