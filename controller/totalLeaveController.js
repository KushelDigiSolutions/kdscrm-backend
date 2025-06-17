import TotalLeave from "../models/Leave/TotalLeave.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

export const postTotalLeaves = asyncHandler(async (req, res) => {
  const { totalLeaves } = req.body;
  try {
    const data = await TotalLeave.findOne({ hr: req.user._id });

    if (data) {
      const updateTotalLeaves = await TotalLeave.findByIdAndUpdate(
        data._id,
        { $set: { totalLeaves } },
        { new: true }
      );

      return res.json({
        success: true,
        message: "Updated!",
        data: updateTotalLeaves,
      });
    } else {
      const newTotalLeave = new TotalLeave({
        hr: req.user._id,
        totalLeaves,
      });

      const saveTotalLeave = await newTotalLeave.save();

      return res.json({
        success: true,
        message: "Saved!",
        data: saveTotalLeave,
      });
    }
  } catch (error) {
    console.error("Error in postTotalLeaves1:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

export const getTotalLeaves = asyncHandler(async (req, res) => {
  const data = await TotalLeave.findOne({ hr: req.user._id });
  return res.json({ success: true, data });
});

export const getAllTotalLeaves = asyncHandler(async (req, res) => {
  const data = await TotalLeave.find();
  return res.json({ success: true, data });
});
