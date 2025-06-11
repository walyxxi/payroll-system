export async function up(knex) {
  // 1. Users table
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("username", 50).unique().notNullable();
    table.string("password_hash", 255).notNullable();
    table.string("role", 10).notNullable().checkIn(["employee", "admin"]);
    table.decimal("salary", 10, 2).defaultTo(0);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.integer("created_by").references("id").inTable("users");
    table.integer("updated_by").references("id").inTable("users");
  });

  // 2. Payroll periods
  await knex.schema.createTable("payroll_periods", (table) => {
    table.increments("id").primary();
    table.date("start_date").notNullable();
    table.date("end_date").notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.integer("created_by").references("id").inTable("users");
    table.integer("updated_by").references("id").inTable("users");
  });

  // 3. Attendance
  await knex.schema.createTable("attendance", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users");
    table
      .integer("payroll_period_id")
      .notNullable()
      .references("id")
      .inTable("payroll_periods");
    table.date("date").notNullable();
    table.string("request_ip", 45);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.integer("created_by").references("id").inTable("users");
    table.integer("updated_by").references("id").inTable("users");
    table.unique(["user_id", "payroll_period_id", "date"]);
  });

  // 4. Overtime
  await knex.schema.createTable("overtime", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users");
    table
      .integer("payroll_period_id")
      .notNullable()
      .references("id")
      .inTable("payroll_periods");
    table.date("date").notNullable();
    table.decimal("hours", 4, 2).notNullable().checkBetween([0.01, 3]);
    table.string("request_ip", 45);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.integer("created_by").references("id").inTable("users");
    table.integer("updated_by").references("id").inTable("users");
  });

  // 5. Reimbursements
  await knex.schema.createTable("reimbursements", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users");
    table
      .integer("payroll_period_id")
      .notNullable()
      .references("id")
      .inTable("payroll_periods");
    table.date("date").notNullable();
    table.decimal("amount", 10, 2).notNullable().checkPositive();
    table.text("description");
    table.string("request_ip", 45);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    table.integer("created_by").references("id").inTable("users");
    table.integer("updated_by").references("id").inTable("users");
  });

  // 6. Payslips
  await knex.schema.createTable("payslips", (table) => {
    table.increments("id").primary();
    table.integer("user_id").notNullable().references("id").inTable("users");
    table
      .integer("payroll_period_id")
      .notNullable()
      .references("id")
      .inTable("payroll_periods");
    table.decimal("base_salary", 10, 2).notNullable();
    table.integer("attendance_days").notNullable();
    table.decimal("overtime_pay", 10, 2).notNullable();
    table.decimal("reimbursement_total", 10, 2).notNullable();
    table.decimal("take_home_pay", 10, 2).notNullable();
    table.jsonb("detail");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.unique(["user_id", "payroll_period_id"]);
  });

  // 7. Audit log
  await knex.schema.createTable("audit_log", (table) => {
    table.increments("id").primary();
    table.string("table_name", 50).notNullable();
    table.integer("record_id");
    table.string("action", 20).notNullable();
    table.integer("performed_by").references("id").inTable("users");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.string("request_ip", 45);
    table.jsonb("detail");
    table.string("request_id", 36);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("audit_log");
  await knex.schema.dropTableIfExists("payslips");
  await knex.schema.dropTableIfExists("reimbursements");
  await knex.schema.dropTableIfExists("overtime");
  await knex.schema.dropTableIfExists("attendance");
  await knex.schema.dropTableIfExists("payroll_periods");
  await knex.schema.dropTableIfExists("users");
}
