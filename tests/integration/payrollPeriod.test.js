import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/utils/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

describe("/api/payroll-period endpoints", () => {
  const usernames = ["adminpp", "employepp"];
  let admin, employee, adminToken, employeeToken, payrollPeriod;

  beforeAll(async () => {
    // Create users
    const adminPassword = await bcrypt.hash("adminpass", 10);
    const employeePassword = await bcrypt.hash("employeepass", 10);
    admin = await prisma.users.create({
      data: {
        username: usernames[0],
        password_hash: adminPassword,
        role: "admin",
        salary: 10000000, // Example salary
      },
    });
    employee = await prisma.users.create({
      data: {
        username: usernames[1],
        password_hash: employeePassword,
        role: "employee",
        salary: 5000000, // Example salary
      },
    });

    // Generate tokens
    adminToken = jwt.sign(
      { userId: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET || "changeme",
      { expiresIn: "1d" }
    );
    employeeToken = jwt.sign(
      { userId: employee.id, username: employee.username, role: employee.role },
      process.env.JWT_SECRET || "changeme",
      { expiresIn: "1d" }
    );
  });

  afterAll(async () => {
    // Find IDs of users to delete
    const users = await prisma.users.findMany({
      where: { username: { in: usernames } },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);

    // Clean up dependent tables
    await prisma.audit_log.deleteMany({
      where: { performed_by: { in: userIds } },
    });
    await prisma.payroll_periods.deleteMany({
      where: { created_by: { in: userIds } },
    });
    await prisma.users.deleteMany({
      where: { username: { in: usernames } },
    });
    await prisma.$disconnect();
  });

  it("admin can create a payroll period", async () => {
    const res = await request(app)
      .post("/api/payroll-period")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        start_date: "2025-06-01",
        end_date: "2025-06-30",
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    payrollPeriod = res.body;
  });

  it("employee cannot create a payroll period", async () => {
    const res = await request(app)
      .post("/api/payroll-period")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({
        start_date: "2025-06-01",
        end_date: "2025-06-30",
      });
    expect(res.statusCode).toBe(403);
  });

  it("can get all payroll periods as authenticated user", async () => {
    const res = await request(app)
      .get("/api/payroll-period")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("can get payroll period by id", async () => {
    const res = await request(app)
      .get(`/api/payroll-period/${payrollPeriod.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(payrollPeriod.id);
  });

  it("admin can update a payroll period", async () => {
    const res = await request(app)
      .patch(`/api/payroll-period/${payrollPeriod.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", payrollPeriod.id);
    payrollPeriod = res.body; // Update the payrollPeriod variable
  });

  it("employee cannot update a payroll period", async () => {
    const res = await request(app)
      .patch(`/api/payroll-period/${payrollPeriod.id}`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ message: "Should Not Work" });
    expect(res.statusCode).toBe(403);
  });

  it("admin can delete a payroll period", async () => {
    const res = await request(app)
      .delete(`/api/payroll-period/${payrollPeriod.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });

  it("employee cannot delete payroll period", async () => {
    // Create a new period for deletion test
    const period = await prisma.payroll_periods.create({
      data: {
        start_date: new Date(Date.now() - 86400000),
        end_date: new Date(Date.now() + 86400000),
        created_by: admin.id,
        updated_by: admin.id,
      },
    });
    const res = await request(app)
      .delete(`/api/payroll-period/${period.id}`)
      .set("Authorization", `Bearer ${employeeToken}`);
    expect(res.statusCode).toBe(403);
    // Clean up
    await prisma.payroll_periods.delete({ where: { id: period.id } });
  });
});
