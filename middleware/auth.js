import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import db from "../db/sql_conn.js";

const isAuthenticated = asyncHandler(async (req, res, next) => {
  try {
    req.user = null;

    const token = req.headers.jwt;
    if (!token) {
      throw new ApiError(401, "UnAuthorized Request");
    }
    const decodedToken = jwt.verify(token, process.env.SK);

    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [decodedToken.userId]);
    if (users.length === 0) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const userDetail = users[0];

    req.user = {
      ...userDetail,
      role: decodedToken.role,
      email: decodedToken.email,
      organizationId: decodedToken.organizationId
    };

    req.token = token;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid User Token");
  }
});

export default isAuthenticated;
