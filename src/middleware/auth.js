import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(new AppError("No token provided", 401));
  const token = authHeader.split(" ")[1];
  if (!token) return next(new AppError("No token provided", 401));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "changeme");
    req.user = decoded;
    next();
  } catch {
    next(new AppError("Invalid token", 401));
  }
};

export const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return next(new AppError("Forbidden", 403));
  }
  next();
};
