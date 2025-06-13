import { auditLog } from "../utils/auditLog.js";
import { prisma } from "../utils/prisma.js";

export const submitOvertime = async (req, res, next) => {
  try {
    const { date, hours, payroll_period_id, description } = req.body;
    const dateStr = new Date(date || "");

    // Check total overtime for this user on this date
    const existingOvertime = await prisma.overtime.findFirst({
      where: {
        user_id: req.user.userId,
        date: dateStr,
      },
    });

    if (existingOvertime) {
      const totalHours = (Number(existingOvertime.hours) || 0) + hours;
      if (totalHours > 3) {
        return res
          .status(400)
          .json({ message: "Total overtime cannot exceed 3 hours per day." });
      }
    }

    // Save overtime
    const overtime = await prisma.overtime.create({
      data: {
        user_id: req.user.userId,
        payroll_period_id,
        date: dateStr,
        hours,
        description,
        request_ip: req.ipAddress || req.ip,
        created_by: req.user.userId,
        updated_by: req.user.userId,
      },
    });

    await auditLog(req, {
      table_name: "overtime",
      record_id: overtime.id,
      action: "insert",
    });

    res.status(201).json(overtime);
  } catch (err) {
    next(err);
  }
};
