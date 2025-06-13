import AppError from "../utils/AppError.js";

export const validate =
  (schema, property = "body") =>
  (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      const details = error.details.map((d) => d.message);
      return next(new AppError("Validation failed", 400, details));
    }
    req[property] = value;
    next();
  };
