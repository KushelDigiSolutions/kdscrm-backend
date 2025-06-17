import mongoose from "mongoose";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { type } from "os";

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: false,
    set: (a) => (a === "" ? undefined : a),
  },
  netSalary: {
    type: String,
    default: "00",
  },
  updateProfile: {
    type: Boolean,
    default: true,
  },
  userAllowance: {
    type: String,
    default: "15",
  },

  dob: {
    type: String,
  },
  document: [
    {
      name: String,
      url: String,
      require: false,
    },
  ],
  EmployeeType: {
    type: String,
  },
  mobile: {
    type: String,
    required: false,
    set: (c) => (c === "" ? undefined : c),
  },
  resetPasswordToken: String,
  resetPasswordExpires: String,
  email: {
    type: String,
    required: false,
    set: (d) => (d === "" ? undefined : d),
  },
  profileImage: {
    type: String,
  },
  lastOrganization: {
    type: String,
    required: false,
    set: (e) => (e === "" ? undefined : e),
  },
  joiningDate: {
    type: String,
  },
  salary: {
    type: String,
    required: false,
    set: (g) => (g === "" ? undefined : g),
  },
  bankDetails: {
    type: String,
    required: false,
    set: (h) => (h === "" ? undefined : h),
  },
  address: {
    type: String,
    required: false,
    set: (i) => (i === "" ? undefined : i),
  },
  password: {
    type: String,
    required: false,
    set: (j) => (j === "" ? undefined : j),
  },
  remainingLeaves: String,
  totalLeaves: String,

  role: {
    type: String,
    default: "USER",
  },

  PermissionRole: {
    type: mongoose.Types.ObjectId,
    ref: "PermissionRole",
    required: false,
    set: (jkk) => (jkk === "" ? undefined : jkk),
  },

  isBreakIn: {
    type: Boolean,
    default: false,
  },

  status: {
    type: String,
    default: "OFFLINE",
  },
  designation: {
    type: String,
    default: "Graphic Designer",
    required: false,
    set: (k) => (k === "" ? undefined : k),
  },

  // ======new=======
  employeeCode: {
    type: String,
    required: false,
    set: (l) => (l === "" ? undefined : l),
  },
  isDeactivated: {
    type: String,
    default: "No",
  },
  department: {
    type: String,
    required: false,
    set: (m) => (m === "" ? undefined : m),
  },
  gmail: {
    type: String,
    required: false,
    set: (n) => (n === "" ? undefined : n),
  },
  reportingManager: {
    type: String,
    required: false,
    set: (o) => (o === "" ? undefined : o),
  },
  email1: {
    type: String,
    required: false,
    set: (p) => (p === "" ? undefined : p),
  },
  gender: {
    type: String,
    required: false,
    set: (q) => (q === "" ? undefined : q),
  },
  createdBy: {
    type: String,
    default: "ADMIN",
  },

  // ==========personal Information=====
  pan: {
    type: String,
    required: false,
    set: (r) => (r === "" ? undefined : r),
  },
  adhar: {
    type: String,
    required: false,
    set: (s) => (s === "" ? undefined : s),
  },
  father: {
    type: String,
    required: false,
    set: (t) => (t === "" ? undefined : t),
  },
  currentAddress: {
    type: String,
    required: false,
    set: (u) => (u === "" ? undefined : u),
  },
  currentState: {
    type: String,
    required: false,
    set: (v) => (v === "" ? undefined : v),
  },
  currentCity: {
    type: String,
    required: false,
    set: (w) => (w === "" ? undefined : w),
  },
  currentPin: {
    type: String,
    required: false,
    set: (x) => (x === "" ? undefined : x),
  },
  residence: {
    type: String,
    required: false,
    set: (y) => (y === "" ? undefined : y),
  },
  perState: {
    type: String,
    required: false,
    set: (z) => (z === "" ? undefined : z),
  },
  perCity: {
    type: String,
    required: false,
    set: (aa) => (aa === "" ? undefined : aa),
  },
  perPin: {
    type: String,
    required: false,
    set: (bb) => (bb === "" ? undefined : bb),
  },
  Martial: {
    type: String,
    required: false,
    set: (cc) => (cc === "" ? undefined : cc),
  },
  nationality: {
    type: String,
    required: false,
    set: (dd) => (dd === "" ? undefined : dd),
  },
  Mother: {
    type: String,
    required: false,
    set: (ee) => (ee === "" ? undefined : ee),
  },

  // ===========proffessional information==============
  qualification: {
    type: String,
    required: false,
    set: (ff) => (ff === "" ? undefined : ff),
  },
  specialization: {
    type: String,
    required: false,
    set: (gg) => (gg === "" ? undefined : gg),
  },
  qualificationType: {
    type: String,
    required: false,
    set: (hh) => (hh === "" ? undefined : hh),
  },
  yearPass: {
    type: String,
    required: false,
    set: (ii) => (ii === "" ? undefined : ii),
  },
  university: {
    type: String,
    required: false,
    set: (jj) => (jj === "" ? undefined : jj),
  },
  college: {
    type: String,
    required: false,
    set: (kk) => (kk === "" ? undefined : kk),
  },
  percentage: {
    type: String,
    required: false,
    set: (ll) => (ll === "" ? undefined : ll),
  },
  previousCompany: {
    type: String,
    required: false,
    set: (mm) => (mm === "" ? undefined : mm),
  },
  previousDesignation: {
    type: String,
    required: false,
    set: (nn) => (nn === "" ? undefined : nn),
  },
  toDate: {
    type: String,
    required: false,
    set: (oo) => (oo === "" ? undefined : oo),
  },
  fromDate: {
    type: String,
    required: false,
    set: (pp) => (pp === "" ? undefined : pp),
  },
  numberOfMonth: {
    type: String,
    required: false,
    set: (qq) => (qq === "" ? undefined : qq),
  },
  Jobdescription: {
    type: String,
    required: false,
    set: (rr) => (rr === "" ? undefined : rr),
  },
  //=========================Leave information ===============
  leaveNumber: {
    type: String,
    required: false,
  },
  // ======================Bank Information====================
  SalaryPay: {
    type: String,
    required: false,
    set: (ss) => (ss === "" ? undefined : ss),
  },
  SalaryBankName: {
    type: String,
    required: false,
    set: (tt) => (tt === "" ? undefined : tt),
  },
  BeneficiaryName: {
    type: String,
    required: false,
    set: (uu) => (uu === "" ? undefined : uu),
  },
  BankIfsc: {
    type: String,
    required: false,
    set: (vv) => (vv === "" ? undefined : vv),
  },
  AccountNumber: {
    type: String,
    required: false,
    set: (ww) => (ww === "" ? undefined : ww),
  },
  confirmAccount: {
    type: String,
    required: false,
    set: (xx) => (xx === "" ? undefined : xx),
  },
  Branch: {
    type: String,
    required: false,
    set: (yy) => (yy === "" ? undefined : yy),
  },
  paySlipType: {
    type: String,
    default: "Monthly Payslip",
  },
  salary: {
    type: String,
  },
  enable2fa: {
    type: Boolean,
    default: false,
  },
  secrets2fa: {
    type: String,
  },
});

userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.SK,
    {
      expiresIn: "500d",
    }
  );
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateResetToken = async function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model("User", userSchema);
export default User;
