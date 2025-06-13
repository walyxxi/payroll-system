import express from "express";
import { login } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { loginSchema } from "../validation/auth.js";

const router = express.Router();

router.post("/login", validate(loginSchema), login);

export default router;
