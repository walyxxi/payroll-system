import bcrypt from "bcrypt";

export async function up(knex) {
  // Insert admin
  await knex("users").insert({
    username: "admin",
    password_hash: await bcrypt.hash("Password123", 10),
    role: "admin",
  });

  // Insert 100 employees
  const employees = [];
  for (let i = 1; i <= 100; i++) {
    employees.push({
      username: `employee${i}`,
      password_hash: await bcrypt.hash(`Password_${i}`, 10),
      role: "employee",
      salary: Math.floor(1000 + Math.random() * 9000),
    });
  }
  await knex("users").insert(employees);
}

export async function down(knex) {
  await knex("users").del();
}
