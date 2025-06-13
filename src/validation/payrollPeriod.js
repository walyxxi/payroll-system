import Joi from "joi";

export const payrollPeriodSchema = Joi.object({
  start_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "start_date must be in YYYY-MM-DD format",
      "any.required": "start_date is required",
    }),
  end_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "end_date must be in YYYY-MM-DD format",
      "any.required": "end_date is required",
    }),
});

export const payrollPeriodIDSchema = Joi.object({
  id: Joi.number().integer().required(),
});
