import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/utils/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

describe("/api/reimbursement", () => {
  let employeeUser, payrollPeriod, token;

  beforeAll(async () => {
    // Clean up dependent and conflicting data
    const username = "reimbuser";
    const users = await prisma.users.findMany({ where: { username } });
    const userIds = users.map((u) => u.id);

    if (userIds.length > 0) {
      await prisma.audit_log.deleteMany({
        where: { performed_by: { in: userIds } },
      });
      await prisma.reimbursements.deleteMany({
        where: { user_id: { in: userIds } },
      });
      await prisma.payroll_periods.deleteMany({
        where: { created_by: { in: userIds } },
      });
      await prisma.users.deleteMany({ where: { id: { in: userIds } } });
    }

    // Create a test user with the "employee" role
    const password = "reimbpass";
    const password_hash = await bcrypt.hash(password, 10);
    employeeUser = await prisma.users.create({
      data: {
        username,
        password_hash,
        role: "employee",
        salary: 5000000, // Example salary
      },
    });

    // Create a payroll period for reimbursement
    payrollPeriod = await prisma.payroll_periods.create({
      data: {
        start_date: new Date(Date.now() - 86400000), // yesterday
        end_date: new Date(Date.now() + 86400000), // tomorrow
        created_by: employeeUser.id,
        updated_by: employeeUser.id,
      },
    });

    token = jwt.sign(
      {
        userId: employeeUser.id,
        username: employeeUser.username,
        role: employeeUser.role,
      },
      process.env.JWT_SECRET || "changeme",
      { expiresIn: "1d" }
    );
  });

  afterAll(async () => {
    // Clean up test data
    const userIds = [employeeUser.id];
    await prisma.audit_log.deleteMany({
      where: { performed_by: { in: userIds } },
    });
    await prisma.reimbursements.deleteMany({
      where: { user_id: { in: userIds } },
    });
    await prisma.payroll_periods.deleteMany({
      where: { created_by: { in: userIds } },
    });
    await prisma.users.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("should submit reimbursement with valid token and body", async () => {
    const res = await request(app)
      .post("/api/reimbursement")
      .set("Authorization", `Bearer ${token}`)
      .send({
        payroll_period_id: payrollPeriod.id,
        amount: 100000,
        description: "Taxi fare",
        date: new Date().toISOString().split("T")[0],
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.user_id).toBe(employeeUser.id);
    expect(res.body.amount).toBe("100000");
    expect(res.body.description).toBe("Taxi fare");
  });

  it("should fail if not authenticated", async () => {
    const res = await request(app)
      .post("/api/reimbursement")
      .send({
        payroll_period_id: payrollPeriod.id,
        amount: 100000,
        description: "No auth",
        date: new Date().toISOString().split("T")[0],
      });
    expect(res.statusCode).toBe(401);
    expect(res.body.error || res.body.message).toBeDefined();
  });

  it("should fail with invalid data", async () => {
    const res = await request(app)
      .post("/api/reimbursement")
      .set("Authorization", `Bearer ${token}`)
      .send({}); // Missing required fields
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("should fail for wrong role", async () => {
    // Create an admin user and token
    const adminUsername = "reimbadmin";
    const adminPassword = await bcrypt.hash("adminpass", 10);
    // Clean up old admin user if exists
    const oldAdmins = await prisma.users.findMany({
      where: { username: adminUsername },
    });
    const oldAdminIds = oldAdmins.map((u) => u.id);
    if (oldAdminIds.length > 0) {
      await prisma.audit_log.deleteMany({
        where: { performed_by: { in: oldAdminIds } },
      });
      await prisma.users.deleteMany({ where: { id: { in: oldAdminIds } } });
    }
    const admin = await prisma.users.create({
      data: {
        username: adminUsername,
        password_hash: adminPassword,
        role: "admin",
        salary: 10000000, // Example salary
      },
    });
    const adminToken = jwt.sign(
      {
        userId: admin.id,
        username: admin.username,
        role: admin.role,
      },
      process.env.JWT_SECRET || "changeme",
      { expiresIn: "1d" }
    );

    const res = await request(app)
      .post("/api/reimbursement")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        payroll_period_id: payrollPeriod.id,
        amount: 50000,
        description: "Admin cannot submit",
        date: new Date().toISOString().split("T")[0],
      });
    expect(res.statusCode).toBe(403);
    expect(res.body.error || res.body.message).toBeDefined();

    // Clean up admin user
    await prisma.audit_log.deleteMany({ where: { performed_by: admin.id } });
    await prisma.users.delete({ where: { id: admin.id } });
  });
});
