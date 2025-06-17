import bcrypt from "bcryptjs";
import User from "../models/User/User.js";
import Hr from "../models/Hr/Hr.js";
import Admin from "../models/Admin/Admin.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Clients from "../models/Tasks/Clients.js";

const generateRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const token = user.generateAuthToken();
    return token;
  } catch (error) {
    // Log the actual error for debugging purposes
    console.error("Error in generateRefreshToken:", error.message);

    throw new ApiError(500, "Something went wrong");
  }
};

const generateClientRefreshToken = async (userId) => {
  try {
    const user = await Clients.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const token = user.generateAuthToken();
    return token;
  } catch (error) {
    // Log the actual error for debugging purposes
    console.error("Error in generateRefreshToken:", error.message);

    throw new ApiError(500, "Something went wrong");
  }
};

export const login = asyncHandler(async (req, res, next) => {
  const { email, password, employeeCode } = req.body;

  const user = await User.findOne({ email }).populate("PermissionRole");

  if (!user) {
    const client = await Clients.findOne({ Email: email });
    // return next(new ApiError(404, "User not found"));
    if (!client) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, client.Password);

    console.log('this ', password)
    if (!isMatch) {
      return res.status(401).json({
        status: false,
        message: "Incorrect password",
      });
    }
    const token = await generateClientRefreshToken(client._id);
    return res.status(200).json({
      status: true,
      message: "Login successful",
      user: client,
      token,
    });
  }

  console.log("user", user);

  const isDeactivated = user.isDeactivated === "Yes";

  if (isDeactivated) {
    return res.status(403).json({
      status: false,
      message: "User account is deactivated",
    });
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    return next(new ApiError(401, "Invalid password"));
  }

  const token = await generateRefreshToken(user._id);

  return res.status(200).json({
    success: true,
    message: "Login success",
    token,
    user,
  });
});


export const changePassword = asyncHandler(async (req, res) => {
  const { oldpassword, newpassword, confirmpassword } = req.body;

  if (newpassword !== confirmpassword) {
    throw new ApiError(401, "New passwords do not match");
  }

  const userRole = req.user.role;
  let Unit;

  switch (userRole) {
    case "USER":
      Unit = User;
      break;
    case "HR":
      Unit = Hr;
      break;
    case "ADMIN":
      Unit = Admin;
      break;
    default:
      throw new ApiError(401, "Invalid user role");
  }

  const user = await Unit.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const check = await bcrypt.compare(oldpassword, user.password);

  if (!check) {
    throw new ApiError(401, "Invalid old password");
  }

  const genpass = await bcrypt.hash(newpassword, 10);

  await Unit.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        password: genpass,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Successfully Password Changed"));
});
