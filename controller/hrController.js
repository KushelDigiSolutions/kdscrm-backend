import Admin from "../models/Admin/Admin.js";
import Hr from "../models/Hr/Hr.js";
import TotalLeave from "../models/Leave/TotalLeave.js";
import User from "../models/User/User.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const getHrs = asyncHandler(async (req, res) => {
  const data = await Hr.find();
  return res
    .status(200)
    .json(new ApiResponse(200, data, " Successfully fetched all the Hrs"));
});

export const deleteHrs = asyncHandler(async (req, res) => {
  await Hr.deleteMany();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, " Successfully deleted all the Hrs"));
});

const generateRefreshToken = async (hrId) => {
  try {
    const hr = await Hr.findById(hrId);

    if (!hr) {
      throw new ApiError(404, "hr not found");
    }

    const token = await hr.generateAuthToken();

    return token;
  } catch (error) {
    // Log the actual error for debugging purposes
    console.error("Error in generateRefreshToken:", error.message);

    throw new ApiError(500, "Something went wrong");
  }
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const hr = await Hr.findOne({ email });

  if (!hr) {
    throw new ApiError(404, "Hr not found");
  }

  const isPasswordValid = await hr.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = await generateRefreshToken(hr._id);

  const loggedHr = await Hr.findById(hr._id).select("-password ");

  return res.json(
    new ApiResponse(
      200,
      {
        loggedHr,
        token,
      },
      "Hr is successfully logged in"
    )
  );
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldpassword, currentPassword } = req.body;

  const hr = await Hr.findById(req.user._id);

  const passwordcheck = await hr.isPasswordCorrect(oldpassword);
  if (!passwordcheck) {
    throw new ApiError(401, "invalid User Old Password");
  }

  await Hr.findByIdAndUpdate(
    req.user._id,
    { $set: { password: currentPassword } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Successfully Password Changed"));
});

// export const createUser = async ({
//   auth,
//   fullName,
//   password,
//   department,
//   employeeId,
//   gmail,
//   reportingManager,
//   designation,
//   joiningDate,
//   email,
//   email1,
//   mobile,
//   gender,
//   dob,
//   pan,
//   adhar,
//   father,
//   currentAddress,
//   currentState,
//   currentCity,
//   currentPin,
//   residence,
//   perState,
//   perCity,
//   perPin,
//   Martial,
//   nationality,
//   Mother,
//   employeeCode,
//   qualification,
//   specialization,
//   qualificationType,
//   yearPass,
//   university,
//   college,
//   percentage,
//   previousCompany,
//   previousDesignation,
//   toDate,
//   fromDate,
//   numberOfMonth,
//   Jobdescription,
//   SalaryPay,
//   SalaryBankName,
//   BeneficiaryName,
//   BankIfsc,
//   AccountNumber,
//   confirmAccount,
//   Branch,
// }) => {
//   if (!auth) {
//     return { success: false, message: "Not Authorised" };
//   }

//   // let emailCheck = await User.findOne({ email });
//   // let phoneCheck = await User.findOne({ mobile });

//   // if (emailCheck || phoneCheck) {
//   //     return { success: false, message: "User already available" };
//   // }

//   // const getTotalLeaves = await TotalLeave.findOne({ hr: auth._id });
//   // if (!getTotalLeaves) {
//   //     return { success: false, message: "Set total leaves for company first" };
//   // }

//   password = await hashSync(password, 6);

//   const newUser = new User({
//     hr: auth._id,
//     adminId: auth.adminId,
//     auth,
//     fullName,
//     password,
//     department,
//     employeeId,
//     gmail,
//     reportingManager,
//     designation,
//     joiningDate,
//     email,
//     email1,
//     mobile,
//     gender,
//     dob,
//     pan,
//     adhar,
//     father,
//     currentAddress,
//     currentState,
//     currentCity,
//     currentPin,
//     residence,
//     perState,
//     perCity,
//     perPin,
//     Martial,
//     nationality,
//     Mother,
//     employeeCode,
//     qualification,
//     specialization,
//     qualificationType,
//     yearPass,
//     university,
//     college,
//     percentage,
//     previousCompany,
//     previousDesignation,
//     toDate,
//     fromDate,
//     numberOfMonth,
//     Jobdescription,
//     SalaryPay,
//     SalaryBankName,
//     BeneficiaryName,
//     BankIfsc,
//     AccountNumber,
//     role: "EMPLOYEE",
//     confirmAccount,
//     Branch,
//   });

//   const saveUser = await newUser.save();

//   let HrEmployee = auth.employeeId;
//   // let AdminEmployee = auth.employeeId;
//   HrEmployee.push(saveUser._id);
//   // AdminEmployee.push(saveUser._id);
//   const updateHr = await Hr.findByIdAndUpdate(
//     auth._id,
//     { $set: { employeeId: HrEmployee } },
//     { new: true }
//   );
//   console.log(updateHr);
//   // const updateAdmin = await Admin.findByIdAndUpdate(auth._id, { $set: { employeeId: AdminEmployee } }, { new: true });
//   // console.log(updateAdmin);

//   return {
//     success: true,
//     data: saveUser,
//     message: "Employee created Successfully",
//   };
// };

export const createUser = asyncHandler(async (req, res) => {
  try {
    const {
      fullName,
      password,
      department,
      gmail,
      reportingManager,
      designation,
      joiningDate,
      email,
      email1,
      mobile,
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
      employeeCode,
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
    } = req.body;

    const newUser = await User.create({
      hr: req.user._id,
      adminId: req.user.adminId,
      auth,
      fullName,
      password,
      department,
      gmail,
      reportingManager,
      designation,
      joiningDate,
      email,
      email1,
      mobile,
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
      employeeCode,
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
      role: "EMPLOYEE",
      confirmAccount,
      Branch,
    });

    const saveUser = await newUser.save();

    let HrEmployee = req.user.employeeCode;
    HrEmployee.push(saveUser._id);
    const updateHr = await Hr.findByIdAndUpdate(
      req.user._id,
      { $set: { employeeCode: HrEmployee } },
      { new: true }
    );

    console.log(updateHr); //debug purpose

    return res.status(200).json({
      success: true,
      data: saveUser,
      message: "Employee created Successfully",
    });
  } catch (error) {
    console.error("Error creating employee:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create employee",
    });
  }
});

export const getUsers = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const data =
    userId && userId !== "" && userId !== "undefined"
      ? await User.findById(userId)
      : await User.find({ hr: req.user._id }, { password: 0 });
  return res
    .status(200)
    .json(new ApiResponse(200, data, " Successfully fetched the all Users"));
});
