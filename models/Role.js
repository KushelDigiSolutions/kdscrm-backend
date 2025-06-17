import mongoose from "mongoose";


const mySchema = new mongoose.Schema({

  name: {
    type: String,
  },
  showTasksDetailPermission: {
    type: Boolean,
    default: false,
  },
  projectEditPermission: {
    type: Boolean,
    default: false,
  },
  showProjectPermission: {
    type: Boolean,
    default: false,
  },
  userAllowanceCreatePermission: {
    type: Boolean,
    default: false,
  },
  projectDeletePermission: {
    type: Boolean,
    default: false,
  },
  createExpensePermission: {
    type: Boolean,
    default: false,
  },
  showExpensePermission: {
    type: Boolean,
    default: false,
  },
  addTaskPermission: {
    type: Boolean,
    default: false,
  },

  halfDayPermission: {
    type: Boolean,
    default: false,
  },
  projectCreatePermission: {
    type: Boolean,
    default: false,
  },
  deleteTaskPermission: {
    type: Boolean,
    default: false,
  },
  editTaskPermission: {
    type: Boolean,
    default: false,
  },
  showAllProjectPermission: {
    type: Boolean,
    default: false,
  },
  userAllowCrtPermission: {
    type: Boolean,
    default: false,
  },
  leadPermission: {
    type: Boolean,
    default: false,
  },
  offerLetterPermission: {
    type: Boolean,
    default: false,
  },
  RelievingLetterPermission: {
    type: Boolean,
    default: false,
  },
  ExperienceLetterPermission: {
    type: Boolean,
    default: false,
  },
  leadEditPermission: {
    type: Boolean,
    default: false,
  },
  leadDeletePermission: {
    type: Boolean,
    default: false,
  },
  leadCreatePermission: {
    type: Boolean,
    default: false,
  },
  hrManagement: {
    type: Boolean,
    default: false
  },
  permissionPagePermission: {
    type: Boolean,
    default: false,
  },
  hrAdminSetupPermission: {
    type: Boolean,
    default: false,
  },
  trainingSetupPermission: {
    type: Boolean,
    default: false,
  },

  hrmsSetUpPermission: {
    type: Boolean,
    default: false,
  },

  leadSystemPermission: {
    type: Boolean,
    default: false,
  },
  attendencePermission: {
    type: Boolean,
    default: false,
  },
  assetsPermission: {
    type: Boolean,
    default: false,
  },
  documentPermission: {
    type: Boolean,
    default: false,
  },
  leaveManagePermission: {
    type: Boolean,
    default: false,
  },
  performancePermission: {
    type: Boolean,
    default: false,
  },

  employeeManagePermission: {
    type: Boolean,
    default: false,
  },


  payrollPermission: {
    type: Boolean,
    default: false,
  },
  activeEmployeePermission: {
    type: Boolean,
    default: false,
  },
  leaveRequestPermission: {
    type: Boolean,
    default: false,
  },
  employeeOnLeavePermission: {
    type: Boolean,
    default: false,
  },
  totalEmployeePermission: {
    type: Boolean,
    default: false,
  },

  hrmsSetupEditPermission: {
    type: Boolean,
    default: false,
  },
  hrmsSetupDeletePermission: {
    type: Boolean,
    default: false,
  },
  hrmsSetupCreatePermission: {
    type: Boolean,
    default: false,
  },
  paySlipActionPermission: {
    type: Boolean,
    default: false,
  },

  leadSystemSettingEditPermission: {
    type: Boolean,
    default: false,
  },
  leadSystemSettingDeletePermission: {
    type: Boolean,
    default: false,
  },
  leadSystemSettingCreatePermission: {
    type: Boolean,
    default: false,
  },
  leaveReqestEditPermission: {
    type: Boolean,
    default: false,
  },
  leaveReqestActionPermission: {
    type: Boolean,
    default: false,
  },
  employeeManageEditPermission: {
    type: Boolean,
    default: false,
  },
  employeeManageActivatePermission: {
    type: Boolean,
    default: false,
  },
  holidaylistPermission: {
    type: Boolean,
    default: false,
  }


}, { timestamps: true });

const roles = mongoose.model("PermissionRole", mySchema);

export default roles;