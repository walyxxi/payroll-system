import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { attendanceSchema } from "../validation/attendance.js";
import { submitAttendance } from "../controllers/attendanceController.js";

const router = express.Router();

router.post(
  "/",
  requireAuth,
  requireRole("employee"),
  validate(attendanceSchema),
  submitAttendance
);

export default router;
