import Branch from "../models/Branch/Branch.js";
import Department from "../models/Department/Department.js";
import Designation from "../models/Designation/Designation.js";
import LeaveType from "../models/LeaveType/LeaveType.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { removeUndefined } from "../utils/util.js";
import Document from "../models/Document/Document.js";
import Industry from "../models/Industry/Industry.js";
import LeadStatus from "../models/Leadstatus/LeadStatus.js";
import LeadSource from "../models/LeadSource/LeadSource.js";

import User from "../models/User/User.js";
import LeadStat from "../models/LeadStat/LeadStat.js";
import LeadTypeCategory from "../models/LeadTypeCategory/LeadTypeCategory.js";
import FollowUpType from "../models/FollowUpType/FollowUpType.js";
import LeadTypeSubCategory from "../models/LeadTypeSubCategory/LeadTypeSubCategory.js";

export const postLeaveType = asyncHandler(async (req, res) => {
  const { name, days, organizationId } = req.body;
  // Basic validation
  if (!name || !days || !organizationId) {
    return res.status(400).json({
      success: false,
      message: "Name, Branch, and Organization ID are required",
    });
  }
  const existLeave = await LeaveType.findOne({ name, organizationId });
  if (existLeave) {
    return res.status(400).json({
      success: false,
      message: "Leave Name Alreday Exist",
    });
  }
  const newLeaveType = await LeaveType.create({
    name,
    days, organizationId,
    ts: new Date().getTime(),
    status: "true",
  });
  return res
    .status(200)
    .json(new ApiResponse(200, newLeaveType, " successfully posted"));
});

export const updateLeaveType = asyncHandler(async (req, res) => {
  const { status, name, days } = req.body;
  const { id } = req.params;
  let updateObj = removeUndefined({ status, name, days });
  // console.log(status, name);
  // console.log(id);

  const updateuserLeaveType = await LeaveType.findByIdAndUpdate(
    id,
    {
      $set: updateObj,
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updateuserLeaveType, "Updated  Successfully"));
});

export const getLeaveTypes = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId
  const data = await LeaveType.find({ organizationId });
  return res
    .status(200)
    .json(new ApiResponse(200, data, "LeaveTypees fetched Successfully"));
});

export const deleteLeaveType = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const data = await LeaveType.findByIdAndDelete(id);
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Deleted   Successfully"));
});

export const postBranch = asyncHandler(async (req, res) => {
  try {
    const { name, organizationId } = req.body;

    if (!name || !organizationId) {
      return res.status(400).json({
        success: false,
        message: "Name and Organization ID are required",
      });
    }

    // Case-insensitive match to avoid duplicate with different casing
    const existBranchName = await Branch.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      organizationId,
    });

    if (existBranchName) {
      return res.status(400).json({
        success: false,
        message: "Branch name already exists",
      });
    }

    const newBranch = await Branch.create({
      name,
      ts: new Date().getTime(),
      status: "true",
      organizationId,
    });

    return res.status(201).json(
      new ApiResponse(201, newBranch, "Branch successfully created")
    );
  } catch (error) {
    console.error("Error in postBranch:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating branch",
      error: error.message,
    });
  }
});

export const updateBranch = asyncHandler(async (req, res) => {
  try {
    const { status, name } = req.body;
    const { id } = req.params;

    // Validate required input
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required",
      });
    }

    // Fetch the current branch for comparison
    const existingBranch = await Branch.findById(id);
    if (!existingBranch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    // If the name is being updated, check for duplicate name in same organization
    if (name && name.toLowerCase() !== existingBranch.name.toLowerCase()) {
      const duplicate = await Branch.findOne({
        name: { $regex: `^${name}$`, $options: "i" },
        organizationId: existingBranch.organizationId,
        _id: { $ne: id }, // exclude current branch
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Branch name already exists in this organization",
        });
      }
    }

    const updateObj = removeUndefined({ status, name });

    const updatedBranch = await Branch.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true }
    );

    return res.status(200).json(
      new ApiResponse(200, updatedBranch, "Branch updated successfully")
    );
  } catch (error) {
    console.error("Error in updateBranch:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating branch",
      error: error.message,
    });
  }
});

export const getBranchs = asyncHandler(async (req, res) => {
  try {
    const { organizationId } = req.user;
    if (!organizationId) {
      return res.status(400).json({ message: "Organization id is required" })
    }
    const data = await Branch.find({ organizationId });
    return res.status(200).json(
      new ApiResponse(200, data, "Branches fetched successfully")
    );
  } catch (error) {
    console.error("Error in getBranchs:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch branches",
      error: error.message,
    });
  }
});

export const deleteBranch = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required",
      });
    }

    const data = await Branch.findByIdAndDelete(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Branch not found or already deleted",
      });
    }

    return res.status(200).json(
      new ApiResponse(200, data, "Branch deleted successfully")
    );
  } catch (error) {
    console.error("Error in deleteBranch:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete branch",
      error: error.message,
    });
  }
});

export const postDepartment = asyncHandler(async (req, res) => {
  try {
    const { name, branch, organizationId } = req.body;

    // Basic validation
    if (!name || !branch || !organizationId) {
      return res.status(400).json({
        success: false,
        message: "Name, Branch, and Organization ID are required",
      });
    }

    // Check if department with same name already exists in same organization
    const existDepartment = await Department.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      organizationId,
    });

    if (existDepartment) {
      return res.status(400).json({
        success: false,
        message: "Department name already exists",
      });
    }

    // Create new department
    const newDepartment = await Department.create({
      name,
      organizationId,
      branch,
      ts: new Date().getTime(),
      status: "true",
    });

    return res.status(201).json(
      new ApiResponse(201, newDepartment, "Department successfully created")
    );

  } catch (error) {
    console.error("Error in postDepartment:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating department",
      error: error.message,
    });
  }
});

export const updateDepartment = asyncHandler(async (req, res) => {
  try {
    const { branch, name, status } = req.body;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Department ID is required",
      });
    }

    const existingDepartment = await Department.findById(id);
    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // ❗️If branch is being changed, name must be present
    if (branch && !name) {
      return res.status(400).json({
        success: false,
        message: "Name is required when updating the branch",
      });
    }

    // ✅ If name or branch is being changed, check for duplicates in target branch
    const targetBranch = branch || existingDepartment.branch;
    const targetName = name || existingDepartment.name;

    const duplicate = await Department.findOne({
      _id: { $ne: id },
      name: { $regex: `^${targetName}$`, $options: "i" },
      organizationId: existingDepartment.organizationId,
      branch: targetBranch,
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Department name already exists in this branch",
      });
    }

    // Proceed with update
    const updateObj = removeUndefined({ name, status, branch });

    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true }
    );

    return res.status(200).json(
      new ApiResponse(200, updatedDepartment, "Department updated successfully")
    );

  } catch (error) {
    console.error("Error in updateDepartment:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update department",
      error: error.message,
    });
  }
});

export const getDepartments = asyncHandler(async (req, res) => {
  try {
    const organizationId = req.user.organizationId
    const data = await Department.find({ organizationId });

    return res
      .status(200)
      .json(new ApiResponse(200, data, "Departments fetched successfully"));
  } catch (error) {
    console.error("Error in getDepartments:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
      error: error.message,
    });
  }
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false, message: "Department ID is required",
      });
    }

    const data = await Department.findByIdAndDelete(id);

    if (!data) {
      return res.status(404).json({
        success: false, message: "Department not found or already deleted",
      });
    }

    return res.status(200).json(new ApiResponse(200, data, "Department deleted successfully"));
  } catch (error) {
    console.error("Error in deleteDepartment:", error.message);
    return res.status(500).json({
      success: false, message: "Failed to delete department", error: error.message,
    });
  }
});

export const postDesignation = asyncHandler(async (req, res) => {
  try {
    const { name, department, organizationId } = req.body;

    if (!name || !department || !organizationId) {
      return res.status(400).json({
        success: false,
        message: "Name, department, and organizationId are required",
      });
    }

    // ✅ Check if designation with same name exists in same department and organization
    const existingDesignation = await Designation.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      department,
      organizationId,
    });

    if (existingDesignation) {
      return res.status(400).json({
        success: false,
        message: "Designation name already exists in this department",
      });
    }

    // ✅ Create new designation
    const newDesignation = await Designation.create({
      name,
      department,
      organizationId,
      ts: new Date().getTime(),
      status: "true",
    });

    return res.status(200).json(
      new ApiResponse(200, newDesignation, "Designation successfully posted")
    );
  } catch (error) {
    console.error("Error in postDesignation:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to post designation",
      error: error.message,
    });
  }
});

export const updateDesignation = asyncHandler(async (req, res) => {
  try {
    const { status, name, department } = req.body;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Designation ID is required",
      });
    }

    // Fetch existing designation
    const existingDesignation = await Designation.findById(id);
    if (!existingDesignation) {
      return res.status(404).json({
        success: false,
        message: "Designation not found",
      });
    }

    // Determine final department to check against (updated or current)
    const targetDepartment = department || existingDesignation.department;

    // ✅ Duplicate check only if name is being changed
    if (
      name &&
      name.toLowerCase() !== existingDesignation.name.toLowerCase()
    ) {
      const duplicate = await Designation.findOne({
        name: { $regex: `^${name}$`, $options: "i" },
        department: targetDepartment,
        organizationId: existingDesignation.organizationId,
        _id: { $ne: id }, // exclude current document
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Designation with this name already exists in this department",
        });
      }
    }

    // Prepare updated fields
    const updateObj = removeUndefined({ name, status, department });

    const updatedDesignation = await Designation.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true }
    );

    return res.status(200).json(
      new ApiResponse(200, updatedDesignation, "Designation updated successfully")
    );
  } catch (error) {
    console.error("Error in updateDesignation:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update designation",
      error: error.message,
    });
  }
});

export const getDesignation = asyncHandler(async (req, res) => {


  const data = await Designation.find({});

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Designationes fetched Successfully"));


});
export const getDesignations = asyncHandler(async (req, res) => {


  const { id } = req.params;

  const designations = await Designation.find({ 'department._id': id }).select('name _id');

  return res
    .status(200)
    .json(new ApiResponse(200, designations, "Designationes fetched Successfully"));


});

export const getEmployess = asyncHandler(async (req, res) => {


  const { id } = req.params;

  const users = await User.find({ 'department._id': id }).select('fullName _id');

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched Successfully"));


});

export const deleteDesignation = asyncHandler(async (req, res) => {
  console.log('yes');
  const { id } = req.params;

  const data = await Designation.findByIdAndDelete(id);
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Deleted   Successfully"));
});


export const createDocSetup = asyncHandler(async (req, res) => {
  try {
    const { name, requiredField, documentType, organizationId } = req.body;

    // Check if document with the same name exists in this organization
    const existingDoc = await Document.findOne({
      name: { $regex: `^${name}$`, $options: "i" }, // case-insensitive match
      organizationId,
    });

    if (existingDoc) {
      return res.status(400).json({
        success: false,
        message: "Document name already exists",
      });
    }

    // Create the document
    const details = await Document.create({
      name,
      requiredField,
      documentType,
      organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "Successfully created",
      data: details,
    });
  } catch (error) {
    console.error("Error in createDocSetup:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create document",
      error: error.message,
    });
  }
});



export const updateDocSetup = asyncHandler(async (req, res) => {
  try {
    const { name, requiredField } = req.body;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Document ID is required",
      });
    }

    const existingDoc = await Document.findById(id);

    if (!existingDoc) {
      return res.status(404).json({
        status: false,
        message: "Document not found",
      });
    }

    // ✅ If name is changing, check for duplicates within the same organization
    if (name && name.toLowerCase() !== existingDoc.name.toLowerCase()) {
      const duplicate = await Document.findOne({
        name: { $regex: `^${name}$`, $options: "i" },
        organizationId: existingDoc.organizationId,
        _id: { $ne: id }, // exclude the current document
      });

      if (duplicate) {
        return res.status(400).json({
          status: false,
          message: "Document name already exists",
        });
      }
    }

    const updateObj = {};
    if (name) updateObj.name = name;
    if (requiredField !== undefined) updateObj.requiredField = requiredField;

    const updatedDoc = await Document.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      status: true,
      message: "Successfully updated",
      data: updatedDoc,
    });

  } catch (error) {
    console.error("Error updating document:", error);
    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
});



export const deleteDocSetup = asyncHandler(async (req, res) => {
  try {

    const { id } = req.params;

    const details = await Document.findByIdAndDelete(id);


    return res.status(200).json({
      status: true,
      message: "Successfuly deleted"
    })

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "INTERNAL Server error "
    })
  }
})


export const fetchAllDocs = asyncHandler(async (req, res) => {
  try {
    const { organizationId } = req.user;
    if (!organizationId) {
      return res.status(500).json({
        success: false,
        message: "organizationId is required",
      });
    }

    // Fetch documents directly filtered by organizationId
    const allDocs = await Document.find({ organizationId });

    return res.status(200).json({
      success: true,
      message: "Documents fetched successfully",
      data: allDocs,
    });
  } catch (error) {
    console.error("Error in fetchAllDocs:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
      error: error.message,
    });
  }
});



export const postLeadSource = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const existLeadSourceName = await LeadSource.findOne({ name });
  if (existLeadSourceName) {
    return res.status(400).json({
      success: false,
      message: "LeadSource Name Alreday Exist",
    });
  }
  const newLeadSource = await LeadSource.create({
    name,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, newLeadSource, " successfully posted", existLeadSourceName));
});

export const getLeadSources = asyncHandler(async (req, res) => {
  const data = await LeadSource.find({});
  return res
    .status(200)
    .json(new ApiResponse(200, data, "leadSources fetched Successfully"));
});

export const updateLeadSources = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  let updateObj = removeUndefined({ name });
  // console.log(status, name);
  // console.log(id);

  const updateLeadsources = await LeadSource.findByIdAndUpdate(
    id,
    {
      $set: updateObj,
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updateLeadsources, "Updated  Successfully"));
});

export const deleteLeadSource = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const data = await LeadSource.findByIdAndDelete(id);
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Deleted   Successfully"));
});

export const postIndustry = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const existIndustry = await Industry.findOne({ name });
  if (existIndustry) {
    return res.status(400).json({
      success: false,
      message: "LeadSource Name Alreday Exist",
    });
  }
  const newIndustry = await Industry.create({
    name,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, newIndustry, " successfully posted", existIndustry));
});

export const getIndustry = asyncHandler(async (req, res) => {
  const data = await Industry.find({});
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Industry fetched Successfully"));
});

export const updateIndustry = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  let updateObj = removeUndefined({ name });
  // console.log(status, name);
  // console.log(id);

  const updateIndustry = await LeadStatus.findByIdAndUpdate(
    id,
    {
      $set: updateObj,
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updateIndustry, "Updated  Successfully"));
});

export const deleteIndustry = asyncHandler(async (req, res) => {

  const { id } = req.params;

  const data = await LeadStatus.findByIdAndDelete(id);
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Deleted   Successfully"));
});


// ==================lead status========================
export const PostLeadStat = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const existLeadStat = await LeadStat.findOne({ name });
  if (existLeadStat) {
    return res.status(400).json({
      success: false,
      message: "LeadSource Name Alreday Exist",
    });
  }
  const newStat = await LeadStat.create({
    name,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, newStat, " successfully posted", existLeadStat));
});

export const getLeadStat = asyncHandler(async (req, res) => {
  const data = await LeadStat.find({});
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Lead Status fetched Successfully"));
});

export const updateLeadStat = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  let updateObj = removeUndefined({ name });
  // console.log(status, name);
  // console.log(id);

  const updateLeadStatus = await LeadStat.findByIdAndUpdate(
    id,
    {
      $set: updateObj,
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updateLeadStatus, "Updated  Successfully"));
});

export const deleteLeadStat = asyncHandler(async (req, res) => {

  const { id } = req.params;

  const data = await LeadStat.findByIdAndDelete(id);
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Deleted   Successfully"));
});



export const PostFollow = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const existFollow = await FollowUpType.findOne({ name });
  if (existFollow) {
    return res.status(400).json({
      success: false,
      message: "FollowUp Name Alreday Exist",
    });
  }
  const newStat = await FollowUpType.create({
    name,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, newStat, " successfully posted", existFollow));
});

export const getFollow = asyncHandler(async (req, res) => {
  const data = await FollowUpType.find({});
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Follow up fetched Successfully"));
});

export const updateFollow = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  let updateObj = removeUndefined({ name });
  // console.log(status, name);
  // console.log(id);

  const updateFollowUp = await FollowUpType.findByIdAndUpdate(
    id,
    {
      $set: updateObj,
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updateFollowUp, "Updated  Successfully"));
});

export const deleteFollow = asyncHandler(async (req, res) => {

  const { id } = req.params;

  const data = await FollowUpType.findByIdAndDelete(id);
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Deleted Successfully"));
});


// ==================lead type category========================

export const postLeadCategory = asyncHandler(async (req, res) => {
  try {
    const { name } = req.body;

    const existingCategory = await LeadTypeCategory.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category name already exists",
      });
    }

    const newCategory = await LeadTypeCategory.create({ name: name.trim() });

    return res.status(201).json({
      success: true,
      message: "New category added successfully",
      data: newCategory,
    });
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
});


export const getLeadCategories = asyncHandler(async (req, res) => {
  try {
    const allCategories = await LeadTypeCategory.find();
    return res.status(200).json({
      success: true,
      message: "All categories fetched successfully",
      data: allCategories,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});


export const updateLeadCategory = asyncHandler(async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;

    const category = await LeadTypeCategory.findById(id);

    if (category) {
      category.name = name;
      const updatedCategory = await category.save();

      res.status(200).json({
        success: true,
        message: "Lead category updated successfully",
        data: updatedCategory,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
});

export const deleteLeadTypeCategory = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCategory = await LeadTypeCategory.findByIdAndDelete(id);

    if (deletedCategory) {
      return res.status(200).json({
        success: true,
        message: "Lead type category deleted successfully",
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Lead type category not found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
});

// ============================lead type subCategory ====================


export const postLeadSubCategory = asyncHandler(async (req, res) => {
  try {
    const { leadCategory, name } = req.body;

    // 1. Validate parent category exists
    const validLeadCategory = await LeadTypeCategory.findById(leadCategory);
    if (!validLeadCategory) {
      return res.status(400).json({
        success: false,
        message: "Invalid LeadTypeCategory ID provided.",
      });
    }

    // 2. Check duplicate subcategory under same parent
    const existingSubCategory = await LeadTypeSubCategory.findOne({
      name: name.trim(),
      category: leadCategory
    });
    if (existingSubCategory) {
      return res.status(400).json({
        success: false,
        message: "Subcategory name already exists under this category.",
      });
    }

    // 3. Create new subcategory
    const newSubCategory = await LeadTypeSubCategory.create({
      name: name.trim(),
      category: leadCategory
    });

    return res.status(201).json({
      success: true,
      message: "New subcategory added successfully",
      data: newSubCategory,
    });
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
});



export const getSubCategory = asyncHandler(async (req, res) => {
  try {
    const allSubCategory = await LeadTypeSubCategory.find({})
      .populate("category");

    return res.status(200).json({
      success: true,
      message: "All subcategories fetched successfully",
      data: allSubCategory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});


// ─── UPDATE SUBCATEGORY ───────────────────────────────────────────────
export const updateSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, leadCategory } = req.body;
  console.log(id, name, leadCategory)

  if (leadCategory) {
    const cat = await LeadTypeCategory.findById(leadCategory);
    if (!cat) {
      return res.status(400).json({
        success: false,
        message: "Invalid parent category ID",
      });
    }
  }

  const updates = {};
  if (name) updates.name = name.trim();
  if (leadCategory) updates.category = leadCategory;

  const updatedSubCat = await LeadTypeSubCategory.findByIdAndUpdate(
    id,
    updates,
    {
      new: true,
      runValidators: true,
    }
  ).populate("category", "name");

  if (!updatedSubCat) {
    return res.status(404).json({
      success: false,
      message: "Subcategory not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Subcategory updated successfully",
    data: updatedSubCat,
  });
});

// ─── DELETE SUBCATEGORY ───────────────────────────────────────────────
export const deleteSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(id)
  const deleted = await LeadTypeSubCategory.findByIdAndDelete(id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: "Subcategory not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Subcategory deleted successfully",
  });
});
