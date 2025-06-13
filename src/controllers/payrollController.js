import { auditLog } from "../utils/auditLog.js";
import { prisma } from "../utils/prisma.js";

/**
 * Admin runs payroll for a payroll period (process payments to employees)
 * POST /api/payroll/:payroll_period_id/run
 */
export const runPayrolls = async (req, res, next) => {
  try {
    const periodId = Number(req.params.payroll_period_id);
    if (!periodId) {
      return res.status(400).json({ message: "Invalid payroll period id." });
    }

    // Check if this period exists
    const period = await prisma.payroll_periods.findUnique({
      where: { id: periodId },
    });
    if (!period) {
      return res.status(404).json({ message: "Payroll period not found." });
    }

    // Check if payroll has already been run for this period
    const payslipsExist = await prisma.payslips.findFirst({
      where: { payroll_period_id: periodId },
    });
    if (payslipsExist) {
      return res.status(400).json({
        message: "Payroll for this period has already been processed.",
      });
    }

    // Get all active employees
    const employees = await prisma.users.findMany({
      where: { role: "employee" },
    });

    // Get all attendance, overtime, and reimbursements for this period and all employees
    const attendanceList = await prisma.attendance.findMany({
      where: { payroll_period_id: periodId },
    });
    const overtimeList = await prisma.overtime.findMany({
      where: { payroll_period_id: periodId },
    });
    const reimbursementList = await prisma.reimbursements.findMany({
      where: { payroll_period_id: periodId },
    });

    // Build payslips
    const payslips = [];
    for (const emp of employees) {
      const userAttendance = attendanceList.filter((a) => a.user_id === emp.id);
      const userOvertime = overtimeList.filter((o) => o.user_id === emp.id);
      const userReimbursements = reimbursementList.filter(
        (r) => r.user_id === emp.id
      );

      const attendanceDays = userAttendance.length;
      const overtimeTotalHours = userOvertime.reduce(
        (sum, o) => sum + (o.hours || 0),
        0
      );
      const hourlyRate = emp.salary ? emp.salary / 173 : 0; // 173 = standard monthly hours
      const overtime_rate =
        overtimeTotalHours === 1
          ? 1.5 * hourlyRate
          : 1.5 * hourlyRate + (overtimeTotalHours - 1) * 2 * hourlyRate; // Default to 1 if not set
      const overtimePay =
        overtimeTotalHours * (overtime_rate || 1) * hourlyRate;
      const reimbursementTotal = userReimbursements.reduce(
        (sum, r) => sum + (r.amount || 0),
        0
      );

      // For example purposes, take-home pay = base salary + overtime + reimbursement
      const takeHomePay = (emp.salary || 0) + overtimePay + reimbursementTotal;

      payslips.push({
        user_id: emp.id,
        payroll_period_id: periodId,
        base_salary: emp.salary || 0,
        attendance_days: attendanceDays,
        overtime_pay: overtimePay,
        reimbursement_total: reimbursementTotal,
        take_home_pay: takeHomePay,
        detail: {
          attendance: userAttendance,
          overtime: userOvertime,
          reimbursements: userReimbursements,
        },
        created_at: new Date(),
      });
    }

    // Bulk insert payslips
    await prisma.payslips.createMany({
      data: payslips,
    });

    await auditLog(req, {
      table_name: "payslip",
      record_id: periodId,
      action: "run-payroll",
      details: {
        payroll_period_id: periodId,
        payslips_created: payslips.length,
      },
    });

    res.status(201).json({
      message: "Payroll processed successfully.",
      payslipsCreated: payslips.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Employee generates payslip for a payroll period (on-demand, but only for periods already run by admin)
 * GET /api/payroll/:payroll_period_id/employee
 */
export const getPayslipByEmployeeId = async (req, res, next) => {
  try {
    const payroll_period_id = Number(req.params.payroll_period_id);
    const user_id = Number(req.params.employee_id) || req.user.userId;

    // Check if payslip for this period and user exists (payroll must be already run)
    const payslip = await prisma.payslips.findFirst({
      where: { user_id, payroll_period_id },
    });

    if (!payslip) {
      return res.status(404).json({
        message: "Payslip not found. Payroll may not have been processed yet.",
      });
    }

    // Breakdown (already stored in payslip.detail)
    const {
      base_salary,
      attendance_days,
      overtime_pay,
      reimbursement_total,
      take_home_pay,
      detail,
    } = payslip;

    // Optionally fetch attendance, overtime, reimbursements if not in detail
    // (but the design is: detail stores snapshot at payroll run time)
    res.json({
      payroll_period_id,
      user_id,
      base_salary,
      attendance_days,
      overtime_pay,
      reimbursement_total,
      reimbursements: detail?.reimbursements || [],
      attendance: detail?.attendance || [],
      overtime: detail?.overtime || [],
      take_home_pay,
      // You can format breakdown as needed for the frontend
      breakdown: {
        base_salary,
        attendance: {
          days: attendance_days,
          affect: `Base salary is ${base_salary} for ${attendance_days} days`,
        },
        overtime: {
          total: overtime_pay,
          detail: detail?.overtime || [],
        },
        reimbursements: {
          total: reimbursement_total,
          list: detail?.reimbursements || [],
        },
        total_take_home: take_home_pay,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin generates a summary of all employee payslips for a payroll period.
 * GET /api/payroll/:payroll_period_id/payslips/summary
 */
export const generatePayslipsSummary = async (req, res, next) => {
  try {
    const payroll_period_id = Number(req.params.payroll_period_id);

    // Get all payslips for this period
    const payslips = await prisma.payslips.findMany({
      where: { payroll_period_id },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
    });

    if (!payslips || payslips.length === 0) {
      return res
        .status(404)
        .json({ message: "No payslips found for this payroll period." });
    }

    const summary = payslips.map((p) => ({
      user_id: p.user_id,
      username: p.user?.username || null,
      take_home_pay: p.take_home_pay,
    }));

    const total_take_home_pay = summary.reduce(
      (sum, p) => sum + (p.take_home_pay || 0),
      0
    );

    res.json({
      summary,
      total_take_home_pay,
    });
  } catch (err) {
    next(err);
  }
};
