import Joi from 'joi';

export const loginSchema = Joi.object({
  username: Joi.string().min(3).max(40).required(),
  password: Joi.string().min(6).max(100).required(),
});