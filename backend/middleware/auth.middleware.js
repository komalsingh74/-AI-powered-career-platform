import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch {
    const error = new Error("Invalid or expired session");
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(payload.sub);

  if (!user) {
    const error = new Error("User account not found");
    error.statusCode = 401;
    throw error;
  }

  req.user = user;
  next();
});

export function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      const error = new Error("You are not allowed to access this resource");
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
}