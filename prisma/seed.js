import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import { logger } from "../src/utils/logger.js";

const prisma = new PrismaClient();

function randomUsername(idx) {
  return `employee${idx}`;
}

function randomSalary() {
  // Salary between 3000 and 7000, rounded to 2 decimals
  return Math.round((3000 + Math.random() * 4000) * 100) / 100;
}

const main = async () => {
  // Hash for password 'password123'
  const employeePassword = await bcrypt.hash("password123", 10);
  const adminPassword = await bcrypt.hash("adminpass", 10);

  // Create admin
  await prisma.users.create({
    data: {
      username: "adminuser",
      password_hash: adminPassword,
      role: "admin",
      salary: 15000,
      created_by: null,
      updated_by: null,
    },
  });

  // Create 100 employees
  const employees = [];
  for (let i = 1; i <= 100; i++) {
    employees.push({
      username: randomUsername(i),
      password_hash: employeePassword,
      role: "employee",
      salary: randomSalary(),
      created_by: null,
      updated_by: null,
    });
  }
  // Use createMany for efficient bulk insert
  await prisma.users.createMany({ data: employees });

  logger.info("Seeded 1 admin and 100 employees!");
};

main()
  .then(() => {
    logger.info("Seed complete!");
    return prisma.$disconnect();
  })
  .catch((e) => {
    logger.error(e);
    process.exit(1);
  });
