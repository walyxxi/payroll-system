import { prisma } from "../utils/prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { logger } from "../utils/logger.js";

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.users.findUnique({
      where: { username },
    });

    if (!user) {
      logger.warn(`Login failed for username: ${username} (user not found)`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      logger.warn(`Login failed for username: ${username} (wrong password)`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET || "changeme",
      { expiresIn: process.env.JWT_EXPIRED_IN || "1d" }
    );

    logger.info(`User login successful: ${username} (id: ${user.id})`);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};
