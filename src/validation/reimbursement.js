import Joi from "joi";

export const reimbursementSchema = Joi.object({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // If not provided, use today
  payroll_period_id: Joi.number().integer().required(),
  amount: Joi.number().positive().required().messages({
    "number.positive": "Amount must be positive.",
    "any.required": "amount is required",
  }),
  description: Joi.string().max(255).required().messages({
    "any.required": "description is required",
  }),
});
