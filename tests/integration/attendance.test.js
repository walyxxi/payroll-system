import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/utils/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

describe("/api/attendance", () => {
  let employeeUser, payrollPeriod, token;

  beforeAll(async () => {
    await prisma.users.deleteMany({ where: { username: "attendanceuser" } });
    // Create a test user with the "employee" role
    const password = "employeepass";
    const password_hash = await bcrypt.hash(password, 10);
    employeeUser = await prisma.users.create({
      data: {
        username: "attendanceuser",
        password_hash,
        role: "employee",
        salary: 5000000, // Example salary
      },
    });

    // Create a payroll period for attendance
    payrollPeriod = await prisma.payroll_periods.create({
      data: {
        start_date: new Date(Date.now() - 86400000), // yesterday
        end_date: new Date(Date.now() + 86400000), // tomorrow
      },
    });

    // Generate a JWT token for the user
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
    // Clean up
    await prisma.audit_log.deleteMany({
      where: { performed_by: employeeUser.id },
    });
    await prisma.attendance.deleteMany({ where: { user_id: employeeUser.id } });
    await prisma.payroll_periods.deleteMany({
      where: { id: payrollPeriod.id },
    });
    await prisma.users.deleteMany({ where: { id: employeeUser.id } });
    await prisma.$disconnect();
  });

  it("should submit attendance with valid token and body", async () => {
    const today = new Date().toISOString().split("T")[0];
    const res = await request(app)
      .post("/api/attendance")
      .set("Authorization", `Bearer ${token}`)
      .send({
        payroll_period_id: payrollPeriod.id,
        date: today,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.user_id).toBe(employeeUser.id);
  });

  it("should fail if not authenticated", async () => {
    const today = new Date().toISOString().split("T")[0];
    const res = await request(app).post("/api/attendance").send({
      payroll_period_id: payrollPeriod.id,
      date: today,
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.error || res.body.message).toBeDefined();
  });

  it("should fail with invalid data", async () => {
    const res = await request(app)
      .post("/api/attendance")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  it("should fail for wrong role", async () => {
    // Create an admin user and token
    const admin = await prisma.users.create({
      data: {
        username: "adminatt",
        password_hash: await bcrypt.hash("adminpass", 10),
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

    const today = new Date().toISOString().split("T")[0];
    const res = await request(app)
      .post("/api/attendance")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        payroll_period_id: payrollPeriod.id,
        date: today,
      });
    expect(res.statusCode).toBe(403);
    expect(res.body.error || res.body.message).toBeDefined();

    await prisma.users.delete({ where: { id: admin.id } });
  });
});
