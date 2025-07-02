import User from "../models/User/User.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { SendEmail } from "../utils/SendEmail.js";
import ActivityTracker from "../models/ActivityTracker/ActivityTracker.js";
import crypto from "crypto";
import fs from "fs";
import { removeUndefined } from "../utils/util.js";
import Leave from "../models/Leave/Leave.js";
import bcrypt from "bcryptjs";
import OTP from '../models/otpModel.js';

import base32 from "hi-base32";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import Clients from "../models/Tasks/Clients.js";
import db from "../db/sql_conn.js"

// Store OTP in MongoDB with an expiration time of 10 minutes
export const storeOTPInDatabase = async (email, otp) => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);  // OTP expires in 10 minutes

  // Store OTP in the database with an expiration timestamp
  const otpRecord = new OTP({
    email,
    otp: otp.toString(),
    expiresAt,
  });

  await otpRecord.save();
  console.log(`OTP for ${email} has been stored in the database`);
};

// Function to validate OTP from MongoDB
export const validateOTPFromDatabase = async (email, otp) => {
  const otpRecord = await OTP.findOne({ email });

  if (!otpRecord) {
    return { success: false, message: 'OTP not found' };
  }

  // Check if OTP has expired
  if (new Date() > otpRecord.expiresAt) {
    await OTP.deleteOne({ email });  // Delete expired OTP
    return { success: false, message: 'OTP has expired' };
  }

  if (otpRecord.otp !== otp) {
    return { success: false, message: 'Invalid OTP' };
  }

  // OTP is valid
  return { success: true, message: 'OTP matched successfully' };
};

const generateOTP = () => {
  const otp = Math.floor(1000 + Math.random() * 9000);
  return otp;
};


const sendOTPEmail = async (email, otp) => {
  const subject = 'Your OTP for Password Reset';
  const text = `Your OTP is: ${otp}. It will expire in 10 minutes.`;
  const html = `<p>Your OTP is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`;

  // Use the SendEmail function to send the OTP
  await SendEmail(email, subject, text, html);
};
export const forgetPasswordVerifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  // Validate OTP from the database or cache (Redis, MongoDB, etc.)
  const otpValidationResult = await validateOTPFromDatabase(email, otp);

  if (!otpValidationResult.success) {
    // If OTP is invalid or expired, return error
    return res.status(400).json({
      success: false,
      message: otpValidationResult.message || 'Invalid or expired OTP'
    });
  }

  // OTP is valid
  return res.status(200).json({
    success: true,
    message: 'OTP matched successfully',
    email,
  });
});

const deleteExistingOTP = async (email) => {
  await OTP.deleteOne({ email }); // Assuming OTPs are stored in an OTPModel collection
};


export const forgotPasswordProcess = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email belongs to a Client
    const Client = await Clients.findOne({ Email: email });
    if (Client) {
      return res.status(400).json({
        success: false,
        message: 'Please contact your admin to reset the password.',
      });
    }

    // Check if user exists by email (not id!)
    const [userRows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (userRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }

    const otp = generateOTP(); // Generate a 6-digit OTP or whatever logic you use

    // Delete existing OTP for this email
    await deleteExistingOTP(email);

    // Store new OTP in DB
    await storeOTPInDatabase(email, otp);

    // Send OTP via email
    await sendOTPEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: `OTP has been sent to ${email}. It will expire in 10 minutes.`,
    });
  } catch (error) {
    console.error('Error in forgotPasswordProcess:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error. Please try again later.',
    });
  }
});


export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    // 1. Validate OTP
    const otpValidationResult = await validateOTPFromDatabase(email, otp);
    if (!otpValidationResult.success) {
      return res.status(400).json(otpValidationResult);
    }

    // 2. Check if user exists
    const [userRows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 3. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update password in DB
    await db.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

    // 5. Delete OTP entry from table
    await OTP.deleteOne({ email });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
    });

  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});


export const Enable2FA = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log("Enable2FA called for:", userId);

    // Check if user exists
    const [userRows] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    const user = userRows[0];


    // Step 1: Generate Base32 secret manually using crypto
    const randomBuffer = crypto.randomBytes(20); // 20 bytes = 160 bits
    const base32_secret = new OTPAuth.Secret({ buffer: randomBuffer }).base32;

    await db.execute('UPDATE users SET secrets2fa = ? WHERE id = ?', [base32_secret, userId]);

    // Step 3: Create OTPAuth URL
    const issuer = "hrms.kusheldigi.com";
    const label = user.email;

    const otpauth_url = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${base32_secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

    // Step 4: Generate QR
    QRCode.toDataURL(otpauth_url, (err, qrUrl) => {
      if (err) {
        console.error("QR Code Error:", err);
        return res.status(500).json({
          status: "fail",
          message: "QR code generation failed"
        });
      }

      return res.json({
        status: "success",
        data: {
          qrCodeUrl: qrUrl,
          secret: base32_secret
        }
      });
    });

  } catch (error) {
    console.error("Enable2FA Error:", error);
    return res.status(500).json({
      status: "fail",
      message: "Something went wrong"
    });
  }
};


const generateBase32Secret = () => {
  const buffer = crypto.randomBytes(15);
  return base32.encode(buffer).replace(/=/g, "").substring(0, 32);
};

export const Verify2fa = async (req, res) => {
  try {
    const { userId, token } = req.body;

    // Step 1: Find user
    const [userRows] = await db.execute("SELECT * FROM users WHERE id = ?", [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const user = userRows[0];

    if (!user.secrets2fa) {
      return res.status(400).json({ status: false, message: "2FA secret not set for this user" });
    }

    // Step 2: Create TOTP instance
    const totp = new OTPAuth.TOTP({
      issuer: "codeninjainsights.com",
      label: "codeninjainsights",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.secrets2fa)
    });
    console.log(totp)

    // Step 3: Validate token
    const delta = totp.validate({ token });

    if (delta === null) {
      return res.status(401).json({
        status: false,
        message: "Invalid or expired OTP token"
      });
    }

    // Step 4: Enable 2FA if not already enabled
    if (!user.enable2fa) {
      await db.execute("UPDATE users SET enable2fa = ? WHERE id = ?", [true, userId]);
    }

    // Step 5: Send success response
    return res.status(200).json({
      status: true,
      message: "2FA verified successfully",
      data: {
        otp_valid: true,
        enable2fa: true
      }
    });

  } catch (error) {
    console.error("2FA verify error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
};



const generateRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const token = await user.generateAuthToken();

    return token;
  } catch (error) {
    // Log the actual error for debugging purposes
    console.error("Error in generateRefreshToken:", error.message);

    throw new ApiError(500, "Something went wrong");
  }
};

export const uploadImgToCloudinary = asyncHandler(async (req, res) => {

  const { image } = req.files;

  const details = await uploadToCloudinary(image.tempFilePath);
  const { secure_url } = details


  return res.status(200).json({
    status: true,
    data: secure_url,
  })

})

export const deleteImgFromCloudinary = asyncHandler(async (req, res) => {
  const { public_id } = req.body;

  if (!public_id) {
    return res.status(400).json({
      status: false,
      message: "public_id is required to delete image.",
    });
  }

  const result = await deleteFromCloudinary(public_id);


  if (result.result === "ok") {
    return res.status(200).json({
      status: true,
      message: "Image deleted successfully.",
      data: result,
    });
  } else {
    return res.status(500).json({
      status: false,
      message: "Failed to delete image from Cloudinary.",
      data: result,
    });
  }
});

export const getUserOwndetail = async (req, res) => {
  const { userId } = req.params;
  const userDetail = await User.findById(userId).populate("PermissionRole");


  return res.status(200).json({
    status: true,
    data: userDetail
  })
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const getThisMonthLeave = async (req, res) => {
  try {
    const { userId } = req.params;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const formattedStartOfMonth = formatDate(startOfMonth);

    const leaves = await Leave.find({
      user: userId,
      from: { $gt: formattedStartOfMonth },
      status: 'Accepted'
    });

    return res.status(200).json({
      status: true,
      totalDays: leaves.length,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const RegisterUser = asyncHandler(async (req, res) => {
  const {
    fullName,
    mobile,
    email,
    image,
    email1,
    password,
    gmail,
    department,
    designation,
    joiningDate,
    pan,
    adhar,
    father,
    currentAddress,
    currentState,
    currentCity,
    currentPin,
    residence,
    perState,
    perCity,
    perPin,
    Martial,
    nationality,
    Mother,
    leaveNumber
  } = req.body;

  if (
    [
      fullName,
      mobile,
      email,
      image,
      email1,
      password,
      gmail,
      department,
      designation,
      joiningDate,
      pan,
      adhar,
      father,
      currentAddress,
      currentState,
      currentCity,
      currentPin,
      residence,
      perState,
      perCity,
      perPin,
      Martial,
      nationality,
      Mother,
      leaveNumber
    ].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are required");
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    return res.status(400).json({
      success: false,
      message: "User Already Exists",
    });
  }

  const UserAvatarLocalPath = req.file?.path;

  if (!UserAvatarLocalPath) {
    throw new ApiError(400, "Avatar local path is required");
  }

  const avatar = await uploadToCloudinary(UserAvatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Error uploading avatar to Cloudinary");
  }

  const user = await User.create({
    fullName,
    mobile,
    email,
    image,
    email1,
    password,
    gmail,
    department,
    designation,
    joiningDate,
    pan,
    adhar,
    father,
    currentAddress,
    currentState,
    currentCity,
    currentPin,
    residence,
    perState,
    perCity,
    perPin,
    Martial,
    nationality,
    Mother,
    leaveNumber,
    profileImage: avatar?.url,
  });

  const createdUser = await User.findById(user._id).select("-password ");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registration");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User Registered Successfully"));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = await generateRefreshToken(user._id);

  const loggedUser = await User.findById(user._id).select("-password ");

  const options = {
    httpOnly: true,
    secure: true,
  };

  res.cookie("token", token, options).json(
    new ApiResponse(
      200,
      {
        user: loggedUser,
        token,
      },
      "User is successfully logged in"
    )
  );
});

export const forgetPassword = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const [userRows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (userRows.length === 0) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

  } catch (error) {

  }
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "User not found");
  }
  const resetToken = await user.generateResetToken();
  await user.save();

  const url = `${process.env.FRONTEND_URL}/resetPassword/${resetToken}`;
  const message = `Click on the link to reset your password: ${url}`;

  // Send reset token via email
  await SendEmail(user.email, "Reset Password", message);

  // Respond with success message
  res.status(200).json(new ApiResponse(200, `Reset token sent to ${user.email}`));
});



export const changePassword = asyncHandler(async (req, res) => {
  const { oldpassword, newpassword, confirmpassword } = req.body;
  if (newpassword !== confirmpassword) {
    throw new ApiError(401, "New passwords do not match");
  }
  const user = await User.findById(req.user._id);

  const passwordcheck = await user.isPasswordCorrect(oldpassword);
  if (!passwordcheck) {
    throw new ApiError(401, "invalid User Old Password");
  }
  user.password = newpassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Successfully Password Changed"));
});

export const updateProfile = asyncHandler(async (req, res) => {
  try {
    const {
      fullName,
      mobile,
      email,
      email1,
      gmail,
      department,
      designation,
      joiningDate,
      pan,
      adhar,
      father,
      currentAddress,
      currentState,
      currentCity,
      qualification,
      currentPin,
      residence,
      perState,
      perCity,
      perPin,
      Martial,
      nationality,
      Mother,
      specialization,
      qualificationType,
      yearPass,
      university,
      college,
      percentage,
      previousCompany,
      previousDesignation,
      toDate,
      fromDate,
      numberOfMonth,
      Jobdescription,
      SalaryPay,
      SalaryBankName,
      BeneficiaryName,
      BankIfsc,
      AccountNumber,
      confirmAccount,
      Branch,
      dob,
      updatePassword,
      profileImage,
      leaveNumber,
    } = req.body;


    // const genpass = await bcrypt.hash(password, 10);
    let updatepasshash = ""

    if (updatePassword) {
      updatepasshash = await bcrypt.hash(updatePassword, 10);
    }

    const obj = removeUndefined({
      fullName,
      mobile,
      leaveNumber,
      email,
      profileImage,
      email1,
      gmail,
      department,
      designation,
      joiningDate,
      pan,
      adhar,
      father,
      currentAddress,
      currentState,
      currentCity,
      currentPin,
      residence,
      perState,
      perCity,
      perPin,
      Martial,
      nationality,
      Mother,
      leaveNumber,
      qualification,
      specialization,
      qualificationType,
      yearPass,
      university,
      college,
      percentage,
      previousCompany,
      previousDesignation,
      toDate,
      fromDate,
      numberOfMonth,
      SalaryPay,
      Jobdescription,
      BeneficiaryName,
      SalaryBankName,
      BankIfsc,
      AccountNumber,
      confirmAccount,
      Branch,
      updateProfile: false,
      dob,
      password: updatepasshash


    });

    const user = await User.findByIdAndUpdate(req.user._id, obj, {
      new: true,
    }).select("-password").populate("PermissionRole");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Updated User Details Successfully"));
  } catch (error) {
    console.log("error is ", error.message);
    throw new ApiError(error.status || 500, "internal server error");
  }
});
export const updateProfileImage = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const { image } = req.files;
    const details = await uploadToCloudinary(image.tempFilePath);

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { profileImage: details.secure_url }, // Assuming 'profileImage' is the field in the User schema
      { new: true } // To return the updated document after the update operation
    );


    console.log("a ", updatedUser);

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "Updated User Details Successfully"));
  } catch (error) {
    console.log("error is ", error.message);
    throw new ApiError(error.status || 500, "internal server error");
  }
});

export const UpdateUser = asyncHandler(async (req, res) => {
  try {
    const {
      fullName,
      department,
      employeeId,
      gmail,
      reportingManager,
      designation,
      joiningDate,
      email,
      email1,
      mobile,
      leaveNumber,
      gender,
      dob,
      pan,
      adhar,
      father,
      currentAddress,
      currentState,
      currentCity,
      currentPin,
      residence,
      perState,
      perCity,
      perPin,
      Martial,
      nationality,
      Mother,
      qualification,
      specialization,
      qualificationType,
      yearPass,
      university,
      college,
      percentage,
      previousCompany,
      previousDesignation,
      toDate,
      fromDate,
      numberOfMonth,
      Jobdescription,
      SalaryPay,
      SalaryBankName,
      BeneficiaryName,
      BankIfsc,
      AccountNumber,
      confirmAccount,
      Branch,
      PermissionRole,
      password
    } = req.body;
    const { userId } = req.params;

    console.log(password)
    // const profileImageLocalPath = req.file?.path;
    // if (!profileImageLocalPath) {
    //   throw new ApiError(401, "avatar file is Missing");
    // }
    // const profileImage = await uploadToCloudinary(profileImageLocalPath);
    // if (!profileImage.url) {
    //   throw new ApiError(400, "error uploading on cloudinary");
    // }

    let updatepasshash = ""

    if (password) {
      updatepasshash = await bcrypt.hash(password, 10);
    }

    console.log(updatepasshash)

    const updateObj = removeUndefined({
      fullName,
      // profileImage: profileImage?.url,
      department,
      employeeId,
      gmail,
      reportingManager,
      designation,
      joiningDate,
      email,
      email1,
      mobile,
      leaveNumber,
      gender,
      dob,
      pan,
      adhar,
      father,
      currentAddress,
      currentState,
      currentCity,
      currentPin,
      residence,
      perState,
      perCity,
      perPin,
      Martial,
      nationality,
      role: department !== "Hr" ? "EMPLOYEE" : "HR",
      Mother,
      qualification,
      specialization,
      qualificationType,
      yearPass,
      university,
      college,
      percentage,
      previousCompany,
      previousDesignation,
      toDate,
      fromDate,
      numberOfMonth,
      Jobdescription,
      SalaryPay,
      SalaryBankName,
      BeneficiaryName,
      BankIfsc,
      AccountNumber,
      confirmAccount,
      Branch,
      password: updatepasshash,
      PermissionRole: PermissionRole === "Select Role" ? null : PermissionRole
    });



    const user = await User.findByIdAndUpdate(userId, updateObj, {
      new: true,
    }).select("-password");
    console.log(user)
    return res
      .status(200)
      .json(new ApiResponse(200, user, "Updated User Details Successfully"));
  } catch (error) {
    console.log("error is ", error.message);
    throw new ApiError(error.status || 500, "internal server error");
  }
});
export const UserProfile = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        message: `your profile is found: ${req.user.fullName}`,
        user: req.user,
      },
      "successfully fetched your profile"
    )
  );
});

export const getUsers = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  let data;

  if (!userId || userId === "undefined" || userId === "") {
    data = await User.find({});
  } else {
    data = await User.findById(userId);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Successfully feteched all Users"));
});

export const getUserByid = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select("-password ");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        UserDetails: user,
      },
      "User details fetched successfully"
    )
  );
});

export const DeleteUserProfile = asyncHandler(async (req, res) => {
  const user = req.user._id;
  await User.findByIdAndDelete(user);
  return res.status(200).json(new ApiResponse(200, {}, "successfully deleted"));
});

export const DeleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await User.findByIdAndDelete(id)
  return res.status(200).json(new ApiResponse(200, {}, "successfully deleted"));
});




export const deleteUsers = asyncHandler(async (req, res) => {
  await User.deleteMany({});
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "successfully deleted all users"));
});

//! check this 
export const getActiveUsers = asyncHandler(async (req, res) => {

  const twelveHoursAgo = new Date();
  twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

  const activeUsers = await ActivityTracker.find({
    clockOut: '0',
    clockIn: { $gte: twelveHoursAgo.getTime() }
  }).populate("user");

  return res.status(200).json(new ApiResponse(200, activeUsers, "Active users fetched successfully"));
});

export const changeBreakIn = async (req, res) => {
  const { isBreakIn, userId } = req.body;
  console.log("is", isBreakIn, userId);
  const userDetail = await User.findById(userId);
  userDetail.isBreakIn = isBreakIn;
  await userDetail.save();

  return res.status(200).json({
    status: true,

  })
}

export const getActiveUsersCount = asyncHandler(async (req, res) => {

  const { organizationId } = req?.user;
  if (!organizationId) {
    return res.status(401).json({ status: false, message: "Unauthorized or missing organizationId" });
  }
  // const 
  // Get the current timestamp in milliseconds
  const currentDateTimestamp = new Date().getTime();

  // Calculate timestamp for 12 hours before the current time
  const twelveHoursAgoTimestamp = currentDateTimestamp - (12 * 60 * 60 * 1000); // 12 hours * 60 minutes * 60 seconds * 1000 milliseconds

  try {
    // Query the ActivityTracker collection to find active users within the specified range
    const activeUsers = await ActivityTracker.find({
      // Query activities within the 12-hour range
      clockIn: { $gte: twelveHoursAgoTimestamp, $lte: currentDateTimestamp },
      organizationId,
      // Exclude entries where clockOut is not '0' or is not present
      $or: [{ clockOut: '0' }, { clockOut: { $exists: false } }]
    });


    // Return the count of active users as a JSON response
    return res.status(200).json(new ApiResponse(200, activeUsers.length, "Active Users count fetched successfully"));
  } catch (error) {
    console.error("Error fetching active users:", error);
    // Return an error response if there's a problem with the query
    return res.status(500).json(new ApiResponse(500, null, "Error fetching active users"));
  }
});

const forgetPassword1 = async ({ email, otp }) => {
  // todo
  let checkUser = await User.findOne({ email });
  if (!checkUser) {
    return { success: false, message: "Invalid Email" };
  }

  let otp1 = fs.readFileSync(`./otp/otp-${email}.txt`, "utf-8");
  console.log(otp1);
  if (Number(otp1) !== Number(otp)) {
    return { success: false, message: "Invalid OTP" };
  }

  return { success: true, message: "Otp matched successfully", email };
};

const forgetPassword2 = async ({ email, password }) => {
  // todo
  let checkUser = await User.findOne({ email });
  if (!checkUser) {
    return { success: false, message: "Invalid Email" };
  }

  // password = await bcrypt.hash(password, 7);
  // console.log(password);
  await User.findByIdAndUpdate(
    checkUser._id,
    { $set: { password } },
    { new: true }
  );

  return { success: true, message: "Password reset successfully" };
};

export const getEmployeesByEmployee = asyncHandler(async (req, res) => {
  const data = await User.find({ hr: req.user.hr, _id: { $ne: req.user._id } });
  return res
    .status(200)
    .json(new ApiResponse(200, data, "data  fetched successfully"));
});

export const uploadDocuments = async (req, res) => {
  const { id } = req.params;

  const {
    adharCard,
    pancard,
    tenCert,
    twevelCert,
    cancelCheque,
    LastOrganization,
    RelievingLetter,
    OfferLetter,
    ExperienceLetter,
    ITR,
    ITR2
  } = req.files;

  try {
    // Find the user by ID
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const documentsToUpdate = [
      { name: 'adharCard', file: adharCard },
      { name: 'pancard', file: pancard },
      { name: 'tenCert', file: tenCert },
      { name: 'twevelCert', file: twevelCert },
      { name: 'cancelCheque', file: cancelCheque },
      { name: 'LastOrganization', file: LastOrganization },
      { name: 'RelievingLetter', file: RelievingLetter },
      { name: 'OfferLetter', file: OfferLetter },
      { name: 'ExperienceLetter', file: ExperienceLetter },
      { name: 'ITR', file: ITR },
      { name: 'ITR2', file: ITR2 }
    ];

    let updatedDocuments = user.document || [];

    for (let doc of documentsToUpdate) {
      if (doc.file) {
        const details = await uploadToCloudinary(doc.file.tempFilePath);

        // Check if the document already exists
        const existingDocIndex = updatedDocuments.findIndex(d => d.name === doc.name);

        if (existingDocIndex >= 0) {
          // Update the existing document's URL
          updatedDocuments[existingDocIndex].url = details.secure_url;
        } else {
          // Add a new document entry
          updatedDocuments.push({ name: doc.name, url: details.secure_url });
        }
      }
    }

    // Save the updated documents to the user schema
    user.documents = updatedDocuments;
    await user.save();

    res.status(200).json({ message: 'Documents uploaded successfully', documents: user.documents });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while uploading documents' });
  }
};

export const uploadSingleImg = async (req, res) => {

  const { Image } = req.files;

  try {

    const details = await uploadToCloudinary(Image.tempFilePath);

    res.status(200).json({ status: true, message: 'Documents uploaded successfully', link: details.secure_url });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while uploading documents' });
  }
};

export const DeactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      status: false,
      message: "User do not exist "
    })
  }

  const newDeactivationStatus = user.isDeactivated === "Yes" ? "No" : "Yes";

  user.isDeactivated = newDeactivationStatus;

  await user.save();

  return res.status(200).json({
    status: true,
    message: `Account successfully ${newDeactivationStatus === "Yes" ? "deactivated" : "activated"}`
  })

})