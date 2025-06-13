import Joi from "joi";

export const attendanceSchema = Joi.object({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // If not provided, use today
  payroll_period_id: Joi.number().integer().required(),
});
