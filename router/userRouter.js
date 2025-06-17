import { Router } from "express";
import {
  UserProfile,
  DeleteUserProfile,
  RegisterUser,
  getUserByid,
  forgetPassword,
  UpdateUser,
  updateProfile,
  updateProfileImage,
  changePassword,
  deleteUsers,
  getActiveUsers,
  changeBreakIn,
  getActiveUsersCount,
  login,
  getUsers,
  getEmployeesByEmployee,
  DeleteUser , 
  uploadDocuments , 
  uploadSingleImg,
  uploadImgToCloudinary,
  DeactivateUser , 
  getThisMonthLeave , 
  getUserOwndetail,forgotPasswordProcess,forgetPasswordVerifyOTP ,resetPassword, deleteImgFromCloudinary

 
} from "../controller/userController.js";
import isAuthenticated from "../middleware/auth.js";
const router = Router();

router.route("RegisterUser").post(RegisterUser);

router.route("/uploadToCloudinary").post(uploadImgToCloudinary);
router.route("/deleteImgFromCloudinary").delete(deleteImgFromCloudinary);


router.route("/deleteImgFromCloudinary").delete(deleteImgFromCloudinary);


router.route("/login").post(login);

router.route("/user-profile").get(isAuthenticated, UserProfile);

router.post("/changePassword", isAuthenticated, changePassword);

router.route("/delete-profile").delete(isAuthenticated, DeleteUserProfile);

router.route("/getUsers").get(isAuthenticated, getUsers);

router.route("/users/:userId").get(isAuthenticated, getUserByid);

router.route("/updateProfile").put(isAuthenticated, updateProfile);

router.route("/updateProfile/:id").post( updateProfileImage);

router.route("/updateUser/:userId").put(isAuthenticated, UpdateUser);

router.route("/forgetPassword").post(forgotPasswordProcess);
router.route("/forgetPasswordVerifyOTP").post(forgetPasswordVerifyOTP);


router.route("/resetPassword").post(resetPassword);

router.route("/deleteprofile").delete(isAuthenticated, DeleteUserProfile);

router.route("/deleteUsers").delete(deleteUsers);

router.route("/deactivateUser/:id").delete(DeactivateUser);

router.delete("/deleteUser/:id", DeleteUser);

router.route("/getActiveUsers").get(isAuthenticated, getActiveUsers);

router.route("/getActiveUsersCount").get(isAuthenticated, getActiveUsersCount);

router.route("/getEmployeesByEmployee").get(isAuthenticated, getEmployeesByEmployee);

// for upload doucments 
router.route("/uploadDocument/:id").post(  uploadDocuments);
router.route("/uploadSingleImg").post( uploadSingleImg);
router.get("/getThisMonthLeave/:userId" , getThisMonthLeave);
router.post("/changeBreakin" , changeBreakIn);
router.post("/getUserOwndetail/:userId" , getUserOwndetail);



export default router;
