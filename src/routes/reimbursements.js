import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { reimbursementSchema } from "../validation/reimbursement.js";
import { submitReimbursement } from "../controllers/reimbursmentController.js";

const router = express.Router();

router.post(
  "/",
  requireAuth,
  requireRole("employee"),
  validate(reimbursementSchema),
  submitReimbursement
);

export default router;
