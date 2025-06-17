import { removeUndefined } from "../utils/util.js";
import Holiday from "../models/Holiday/Holiday.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

export const postHoliday = asyncHandler(async (req, res) => {
  const { holidayName, holidayDate } = req.body;
  const admin =
    req.user.role === "HR"
      ? req.user.adminId
      : req.user.role === "ADMIN"
        ? req.user._id
        : undefined;

  const newHoliday = await Holiday.create({
    admin,
    holidayDate,
    holidayName,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, newHoliday, "Holiday created Successfully"));
});

export const updateHoliday = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { holidayName, holidayDate } = req.body;
    const updateObj = removeUndefined({ holidayName, holidayDate });
    const data = await Holiday.findByIdAndUpdate(id, updateObj, {
      new: true,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, data, "Holiday updated Successfully"));
  } catch (error) {
    console.log(error.message);
  }
});

export const getHolidays = asyncHandler(async (req, res) => {

  const admin = req.user.role === "ADMIN" ? req.user._id : req.user.adminId;
  
  const data = await Holiday.find({ admin });

  return res.status(200).json(new ApiResponse(200, data, "successfully fetched all the holidays"));
});

export const deleteHoliday = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Holiday.findByIdAndDelete(id);
  return res.status(200).json(new ApiResponse(200, {}, "successfully deleted"));
});

export const getAllHolidays = asyncHandler(async (req, res) => {
  const data = await Holiday.find();
  return res
    .status(200)
    .json(new ApiResponse(200, data, "successfully fetched all holidays"));
});

export const deleteAllHolidays = asyncHandler(async (req, res) => {
  await Holiday.deleteMany({});
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "successfully deleted all holidays"));
});
