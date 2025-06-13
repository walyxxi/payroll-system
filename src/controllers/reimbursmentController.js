import { auditLog } from "../utils/auditLog.js";
import { prisma } from "../utils/prisma.js";

export const submitReimbursement = async (req, res, next) => {
  try {
    const { payroll_period_id, amount, description, date } = req.body;
    const dateStr = new Date(date || "");

    // Save reimbursement
    const reimbursement = await prisma.reimbursements.create({
      data: {
        user_id: req.user.userId,
        payroll_period_id,
        date: dateStr,
        amount,
        description,
        request_ip: req.ipAddress || req.ip,
        created_by: req.user.userId,
        updated_by: req.user.userId,
      },
    });

    await auditLog(req, {
      table_name: "reimbursements",
      record_id: reimbursement.id,
      action: "insert",
    });

    res.status(201).json(reimbursement);
  } catch (err) {
    next(err);
  }
};
