/**
 * Middleware to standardize the request IP as req.ipAddress
 * (and ensure trust proxy is set)
 */

import { logger } from "../utils/logger.js";

export const ipAddressMiddleware = (req, res, next) => {
  if (!req.ip) {
    return next(new Error("Request IP not found"));
  }
  logger.debug(`IP Address Middleware: Setting req.ipAddress to ${req.ip}`);
  req.ipAddress = req.ip;
  next();
};
