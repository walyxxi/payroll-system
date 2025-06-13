import Joi from "joi";

export const payrollRunSchema = Joi.object({
  payroll_period_id: Joi.number().integer().required(),
});

export const payslipSchema = Joi.object({
  payroll_period_id: Joi.number().integer().required(),
  employee_id: Joi.number().integer().required(),
});
