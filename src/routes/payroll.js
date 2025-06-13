import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { payrollRunSchema, payslipSchema } from "../validation/payroll.js";
import {
  generatePayslipsSummary,
  getPayslipByEmployeeId,
  runPayrolls,
} from "../controllers/payrollController.js";

const router = express.Router();

router.post(
  "/:payroll_period_id/run",
  requireAuth,
  requireRole("admin"),
  validate(payrollRunSchema, "params"),
  runPayrolls
);
router.get(
  "/:payroll_period_id/payslip/:employee_id",
  requireAuth,
  validate(payslipSchema, "params"),
  getPayslipByEmployeeId
);
router.get(
  "/:payroll_period_id/payslips/summary",
  requireAuth,
  requireRole("admin"),
  validate(payrollRunSchema, "params"),
  generatePayslipsSummary
);

export default router;
