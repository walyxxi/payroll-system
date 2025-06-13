import { prisma } from "./prisma.js";

export const auditLog = async (req, _data) =>
  await prisma.audit_log.create({
    data: {
      performed_by: req.user.userId,
      created_at: new Date(),
      request_ip: req.ipAddress || req.ip,
      request_id: req.headers["x-request-id"] || null,
      detail: { body: req.body },
      ..._data,
    },
  });
