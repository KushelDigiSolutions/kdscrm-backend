import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const mySchema = new mongoose.Schema({
  usersCreated: {
    type: Array,
    default: [],
  },
  fullName: String,
  dob: String,
  mobile: String,
  email: String,
  password: String,
  role: {
    type: String,
    default: "ADMIN",
  },
  employeeCode: String,
  profileImage: String,
});

mySchema.methods.generateAuthToken = function () {
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

mySchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

mySchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

mySchema.methods.generateResetToken = async function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

const Admin = mongoose.model("Admin", mySchema);

export default Admin;
