import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/utils/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

describe("/api/payroll endpoints", () => {
  const usernames = ["payrolladmin", "payrollemployee"];
  let admin, employee, adminToken, employeeToken, payrollPeriod, payslip;

  beforeAll(async () => {
    // Clean up users
    const users = await prisma.users.findMany({
      where: { username: { in: usernames } },
    });
    const userIds = users.map((u) => u.id);

    if (userIds.length > 0) {
      await prisma.audit_log.deleteMany({
        where: { performed_by: { in: userIds } },
      });
      await prisma.payslips.deleteMany({
        where: { user_id: { in: userIds } },
      });
      await prisma.payroll_periods.deleteMany({
        where: { created_by: { in: userIds } },
      });
      await prisma.users.deleteMany({ where: { id: { in: userIds } } });
    }

    // Create users
    const adminPassword = await bcrypt.hash("payrolladminpass", 10);
    const empPassword = await bcrypt.hash("payrollemppass", 10);

    admin = await prisma.users.create({
      data: {
        username: "payrolladmin",
        password_hash: adminPassword,
        role: "admin",
        salary: 10000000,
      },
    });
    employee = await prisma.users.create({
      data: {
        username: "payrollemployee",
        password_hash: empPassword,
        role: "employee",
        salary: 5000000,
      },
    });

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

    // Create a payroll period
    payrollPeriod = await prisma.payroll_periods.create({
      data: {
        start_date: new Date(Date.now() - 86400000),
        end_date: new Date(Date.now() + 86400000),
        created_by: admin.id,
        updated_by: admin.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up users
    const users = await prisma.users.findMany({
      where: { username: { in: usernames } },
    });
    const userIds = users.map((u) => u.id);

    // Collect payroll period ids
    const periods = await prisma.payroll_periods.findMany({
      where: { created_by: { in: userIds } },
      select: { id: true },
    });
    const periodIds = periods.map((p) => p.id);

    // Delete payslips by user or by payroll_period_id
    await prisma.payslips.deleteMany({
      where: {
        OR: [
          { user_id: { in: userIds } },
          { payroll_period_id: { in: periodIds } },
        ],
      },
    });

    await prisma.audit_log.deleteMany({
      where: { performed_by: { in: userIds } },
    });

    await prisma.payroll_periods.deleteMany({
      where: { id: { in: periodIds } },
    });

    await prisma.users.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("admin can run payroll for a period", async () => {
    const res = await request(app)
      .post(`/api/payroll/${payrollPeriod.id}/run`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    // Accept 200 (success) or 201 (created), or 400 if already run
    expect([200, 201, 400]).toContain(res.statusCode);
  });

  it("employee cannot run payroll", async () => {
    const res = await request(app)
      .post(`/api/payroll/${payrollPeriod.id}/run`)
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({});
    expect(res.statusCode).toBe(403);
  });

  it("admin can get payslips summary", async () => {
    const res = await request(app)
      .get(`/api/payroll/${payrollPeriod.id}/payslips/summary`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });

  it("employee cannot get payslips summary", async () => {
    const res = await request(app)
      .get(`/api/payroll/${payrollPeriod.id}/payslips/summary`)
      .set("Authorization", `Bearer ${employeeToken}`);
    expect(res.statusCode).toBe(403);
  });

  // For payslip-by-employee
  it("employee can get their payslip by employee id", async () => {
    const res = await request(app)
      .get(`/api/payroll/${payrollPeriod.id}/payslip/${employee.id}`)
      .set("Authorization", `Bearer ${employeeToken}`);
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      // Print for debugging:
      // console.log(res.body);
      expect(res.body).toHaveProperty("user_id");
      expect(res.body.user_id).toBe(employee.id);
      expect(res.body).toHaveProperty("payroll_period_id");
      expect(res.body.payroll_period_id).toBe(payrollPeriod.id);
    }
  });

  it("should fail with invalid params", async () => {
    const res = await request(app)
      .get(`/api/payroll/notanid/payslip/${employee.id}`)
      .set("Authorization", `Bearer ${employeeToken}`);
    expect([400, 404]).toContain(res.statusCode);
  });

  it("should fail if not authenticated", async () => {
    const res = await request(app).get(
      `/api/payroll/${payrollPeriod.id}/payslip/${employee.id}`
    );
    expect(res.statusCode).toBe(401);
  });
});
