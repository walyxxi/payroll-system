import Joi from "joi";

export const overtimeSchema = Joi.object({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // If not provided, use today
  payroll_period_id: Joi.number().integer().required(),
  hours: Joi.number().min(0.1).max(3).required().messages({
    "number.max": "Overtime cannot be more than 3 hours per day.",
    "number.min": "Overtime must be at least 0.1 hour.",
    "any.required": "hours is required",
  }),
  description: Joi.string().max(255).required().messages({
    "any.required": "description is required",
  }),
});
