import { removeUndefined } from "../utils/util.js";
import Project from "../models/Project/Project.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

export const postProject = asyncHandler(async (req, res) => {
  const {
    projectName,
    client,
    startDate,
    endDate,
    price,
    priority,
    projectLeader,
    teamMembers,
    description,
  } = req.body;

  const files = req.files.map((file) => file.path);
  if (!files || files.length === 0) {
    throw new ApiError(400, "No files uploaded");
  }

  try {
    const cloudinaryPromises = files.map((localpath) =>
      uploadToCloudinary(localpath)
    );

    const cloudinaryResults = await Promise.all(cloudinaryPromises);

    const cloudinaryUrls = cloudinaryResults.map((result) => {
      if (!result.secure_url) {
        throw new Error("Failed to upload to Cloudinary");
      }
      return result?.secure_url;
    });

    const newProject = await Project.create({
      admin: req.user.adminId,
      user: req.user._id,
      projectName,
      client,
      startDate,
      endDate,
      price,
      priority,
      projectLeader,
      teamMembers,
      description,
      file: cloudinaryUrls,
      createdBy: req.user.role,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, newProject, "Project created Successfully"));
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error.message);
    throw new ApiError(500, "Failed to upload files to Cloudinary");
  }
});

export const getProjects = asyncHandler(async (req, res) => {
  const { projectName, employeeName, page, perPage, projectId } = req.query;

  if (projectId && projectId !== "undefined" && projectId !== "") {
    const data = await Project.findById(projectId);
    if (data) {
      return res
        .status(200)
        .json(new ApiResponse(200, data, "Project retrieved Successfully"));
    } else {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Project not found"));
    }
  }

  const and =
    req.user.role === "HR"
      ? [{ user: req.user._id }]
      : req.user.role === "ADMIN"
        ? [{ admin: req.user._id }]
        : [];

  if (projectName && projectName !== "" && projectName !== "undefined") {
    and.push({ projectName: { $regex: projectName } });
  }
  if (employeeName && employeeName !== "" && employeeName !== "undefined") {
    and.push({ "teamMembers.fullName": { $regex: employeeName } });
  }

  const data = await Project.find(and.length > 0 ? { $and: and } : {})
    .skip(page * perPage)
    .limit(perPage);

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Project retrieved Successfully"));
});

export const getProjectsByEmployee = asyncHandler(async (req, res) => {
  const { page, perPage, query } = req.query;

  const userObjectId = req.user._id.toString();

  let or = [];
  if (query) {
    const regexQuery = { $regex: query, $options: "i" };

    or.push({ projectName: regexQuery });
    or.push({ client: regexQuery });
    or.push({ price: regexQuery });
    or.push({ description: regexQuery });
    or.push({ "teamMembers.fullName": regexQuery });

    const data = await Project.find({
      teamMembers: { $elemMatch: { _id: userObjectId } },
      $or: or.length ? or : undefined,
    })
      .skip(page * perPage)
      .limit(perPage);

    return { success: true, data };
  }

  const data = await Project.find({
    "teamMembers._id": userObjectId,
  })
    .skip(page * perPage)
    .limit(perPage);

  return { success: true, data };
});

export const getProjectsByAdmin = asyncHandler(async (req, res) => {
  try {
    const { projectName, employeeName, page, perPage } = req.query;
    const and = [{ admin: req.user._id }];
    if (projectName && projectName !== "" && projectName !== "undefined") {
      and.push({ projectName: { $regex: projectName } });
    }
    if (employeeName && employeeName !== "" && employeeName !== "undefined") {
      and.push({ "teamMembers.fullName": { $regex: employeeName } });
    }

    const data = await Project.find(and.length > 0 ? { $and: and } : {})
      .skip(page * perPage)
      .limit(perPage);

    return res
      .status(200)
      .json(new ApiResponse(200, data, "successfully feteched  projects"));
  } catch (error) {
    console.log("error is ", error.message);
    throw new ApiError(error.status || 500, "internal server error");
  }
});

export const getAllProjects = asyncHandler(async (req, res) => {
  const data = await Project.find();
  return res
    .status(200)
    .json(new ApiResponse(200, data, "successfully feteched all projects"));
});

export const deleteAllProjects = asyncHandler(async (req, res) => {
  await Project.deleteMany();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "successfully deleted all projects"));
});

export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    projectName,
    client,
    startDate,
    endDate,
    price,
    priority,
    projectLeader,
    teamMembers,
    description,
    status,
  } = req.body;

  const files = req.files?.map((file) => file.path);
  if (!files || files.length === 0) {
    throw new ApiError(400, "No files uploaded");
  }

  const cloudinaryPromises = files.map((localpath) =>
    uploadToCloudinary(localpath)
  );

  const cloudinaryResults = await Promise.all(cloudinaryPromises);

  const cloudinaryUrls = cloudinaryResults.map((result) => {
    if (!result.secure_url) {
      throw new Error("Failed to upload to Cloudinary");
    }
    return result?.secure_url;
  });
  const updateProject = await Project.findByIdAndUpdate(
    id,
    {
      $set: {
        projectName,
        client,
        startDate,
        endDate,
        price,
        priority,
        projectLeader,
        teamMembers,
        description,
        status,
        file: cloudinaryUrls,
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updateProject, "Project Updated  Successfully"));
});

export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Project.findByIdAndDelete(id);
  return res.status(200).json(new ApiResponse(200, {}, "successfully deleted"));
});
