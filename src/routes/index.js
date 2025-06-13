import express from "express";
import authRoutes from "./auth.js";
import payrollPeriodRoutes from "./payrollPeriod.js";
import attendanceRoutes from "./attendance.js";
import overtimeRoutes from "./overtime.js";
import reimbursementRoutes from "./reimbursements.js";
import payrollRoutes from "./payroll.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/payroll-period", payrollPeriodRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/overtime", overtimeRoutes);
router.use("/reimbursement", reimbursementRoutes);
router.use("/payroll", payrollRoutes);

export default router;
