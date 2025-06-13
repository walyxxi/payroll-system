import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { overtimeSchema } from "../validation/overtime.js";
import { submitOvertime } from "../controllers/overtimeController.js";

const router = express.Router();

router.post(
  "/",
  requireAuth,
  requireRole("employee"),
  validate(overtimeSchema),
  submitOvertime
);

export default router;
