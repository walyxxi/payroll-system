import { auditLog } from "../utils/auditLog.js";
import { prisma } from "../utils/prisma.js";

export const submitAttendance = async (req, res, next) => {
  try {
    const { date, payroll_period_id } = req.body;
    const dateStr = new Date(date || "");

    // Check if weekend
    const dateObj = new Date(dateStr);
    const day = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) {
      return res.status(400).json({
        message: "Attendance submissions are not allowed on weekends.",
      });
    }

    // Only one attendance per user per day
    const existing = await prisma.attendance.findFirst({
      where: {
        user_id: req.user.userId,
        date: dateStr,
      },
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Attendance for this date already submitted." });
    }

    // Save attendance
    const attendance = await prisma.attendance.create({
      data: {
        user_id: req.user.userId,
        payroll_period_id,
        date: dateStr,
        request_ip: req.ipAddress || req.ip,
        created_by: req.user.userId,
        updated_by: req.user.userId,
      },
    });

    await auditLog(req, {
      table_name: "attendance",
      record_id: attendance.id,
      action: "insert",
    });

    res.status(201).json(attendance);
  } catch (err) {
    next(err);
  }
};
