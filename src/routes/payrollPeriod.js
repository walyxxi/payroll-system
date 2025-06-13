import express from "express";
import {
  createPayrollPeriod,
  getPayrollPeriods,
  getPayrollPeriodById,
  updatePayrollPeriod,
  deletePayrollPeriod,
} from "../controllers/payrollPeriodController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  payrollPeriodSchema,
  payrollPeriodIDSchema,
} from "../validation/payrollPeriod.js";

const router = express.Router();

router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  validate(payrollPeriodSchema),
  createPayrollPeriod
);
router.get("/", requireAuth, getPayrollPeriods);
router.get(
  "/:id",
  requireAuth,
  validate(payrollPeriodIDSchema, "params"),
  getPayrollPeriodById
);
router.patch(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validate(payrollPeriodIDSchema, "params"),
  updatePayrollPeriod
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validate(payrollPeriodIDSchema, "params"),
  deletePayrollPeriod
);

export default router;
