import { Router } from "express";
import {
    createOrganization, getOrganization, UpdateUserActivityMode,
    getOrganizationById, updateOrganization, deleteOrganization,
    providePermissions, getAllPerissionRoles, getOrganizationPermission,
    getPermission, updatePermission, deletePermissionRole,
    createUser, UpdateUser, GetUsers, GetSingleUser,
    getUserByOrganization, deleteUser, userLogin, postAssets,
    getAssets, getAssetsByID, getAssetsByOrganization, updateAsset,
    deleteAsset, uploadUserDocuments, getUserDocuments, createAdmin
} from "../controller/sql/user.js";
import isAuthenticated from "../middleware/auth.js";
// import { uploadToCloudinary } from "../../utils/cloudinary.js";


const router = Router();

router.post("/createOrganization", createOrganization);
router.get("/getOrganization", getOrganization);
router.get("/organization/:id", getOrganizationById);
router.put("/updateOrganization/:id", updateOrganization);
router.delete("/deleteOrganization/:id", deleteOrganization);

router.post("/postPermissions", isAuthenticated, providePermissions);
router.get("/allPermissions", getAllPerissionRoles);
router.get("/fetchAllPermissions", isAuthenticated, getOrganizationPermission);
router.get("/getPermission", getPermission);
router.put("/updatePermission", updatePermission)
router.post("/deletePermissionRole", deletePermissionRole);

router.post("/uploadDocuments/:userId", uploadUserDocuments);
router.get("/getUserDocuments", getUserDocuments);

router.post("/creatUser", isAuthenticated, createUser);
router.post("/createAdmin", createAdmin);

router.post("/login", userLogin);
router.get("/getUsers", GetUsers);
router.get("/getuser", GetSingleUser);
router.get("/allusers", isAuthenticated, getUserByOrganization);
router.put("/Update/:id", UpdateUser);
router.delete("/changeStatus/:id", UpdateUserActivityMode);
router.delete("/deleteUser", deleteUser);

router.post("/postAssets", isAuthenticated, postAssets);
router.get("/getAssets", getAssets);
router.get("/asset", getAssetsByID);
router.get("/getAllAssets", isAuthenticated, getAssetsByOrganization);
router.put("/updateAsset/:id", updateAsset);
router.delete("/deleteAsset", deleteAsset);

export default router;