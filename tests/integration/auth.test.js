import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../../src/utils/prisma.js";
import bcrypt from "bcryptjs";

describe("/api/auth/login", () => {
  let user;

  beforeAll(async () => {
    // Create a test user in the database
    const password = "testpassword";
    const password_hash = await bcrypt.hash(password, 10);
    user = await prisma.users.create({
      data: {
        username: "testuser",
        password_hash,
        role: "employee",
        salary: 5000000, // Example salary
      },
    });
  });

  afterAll(async () => {
    // Remove the test user
    await prisma.users.deleteMany({ where: { username: "testuser" } });
    await prisma.$disconnect();
  });

  it("returns a token and user info for valid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "testuser", password: "testpassword" });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body.user).toMatchObject({
      id: user.id,
      username: "testuser",
      role: "employee",
    });
  });

  it("returns 401 for wrong password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "testuser", password: "wrongpassword" });
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid credentials");
  });

  it("returns 401 for non-existent user", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "nouser", password: "irrelevant" });
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Invalid credentials");
  });

  it("returns 400 for invalid input", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "", password: "" });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed");
  });
});
