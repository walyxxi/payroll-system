import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { auditLog } from "../utils/auditLog.js";

/**
 * Create a payroll period (admin only)
 * POST /api/payroll-periods
 */
export const createPayrollPeriod = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.body;

    const period = await prisma.payroll_periods.create({
      data: {
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        created_by: req.user.userId,
        updated_by: req.user.userId,
      },
    });

    await auditLog(req, {
      table_name: "payroll_periods",
      record_id: period.id,
      action: "insert",
    });

    logger.info(
      `Payroll period created by admin ${req.user.username}: ${start_date} - ${end_date}`
    );
    res.status(201).json(period);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all payroll periods (any authenticated user)
 * GET /api/payroll-periods
 */
export const getPayrollPeriods = async (req, res, next) => {
  try {
    const periods = await prisma.payroll_periods.findMany({
      orderBy: { start_date: "desc" },
    });
    res.json(periods);
  } catch (err) {
    next(err);
  }
};

/**
 * Get a payroll period by ID (any authenticated user)
 * GET /api/payroll-periods/:id
 */
export const getPayrollPeriodById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const period = await prisma.payroll_periods.findUnique({
      where: { id: Number(id) },
    });
    if (!period) {
      return res.status(404).json({ message: "Payroll period not found" });
    }
    res.json(period);
  } catch (err) {
    next(err);
  }
};

/**
 * Update payroll period (admin only)
 * PATCH /api/payroll-periods/:id
 */
export const updatePayrollPeriod = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only." });
    }
    const { id } = req.params;
    const { start_date, end_date } = req.body;

    const oldPeriod = await prisma.payroll_periods.findUnique({
      where: { id: Number(id) },
    });
    if (!oldPeriod) {
      return res.status(404).json({ message: "Payroll period not found" });
    }

    const period = await prisma.payroll_periods.update({
      where: { id: Number(id) },
      data: {
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        updated_by: req.user.userId,
      },
    });

    await auditLog(req, {
      table_name: "payroll_periods",
      record_id: period.id,
      action: "update",
    });

    logger.info(
      `Payroll period updated by admin ${req.user.username}: id=${id}`
    );
    res.json(period);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete payroll period (admin only)
 * DELETE /api/payroll-periods/:id
 */
export const deletePayrollPeriod = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only." });
    }
    const { id } = req.params;
    const oldPeriod = await prisma.payroll_periods.findUnique({
      where: { id: Number(id) },
    });
    if (!oldPeriod) {
      return res.status(404).json({ message: "Payroll period not found" });
    }

    await prisma.payroll_periods.delete({
      where: { id: Number(id) },
    });

    await auditLog(req, {
      table_name: "payroll_periods",
      record_id: period.id,
      action: "delete",
    });

    logger.info(
      `Payroll period deleted by admin ${req.user.username}: id=${id}`
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
