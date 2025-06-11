import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

import userRoutes from "./routes/userRoutes.js";

const app = express();

app.use(bodyParser.json());

// Example route
app.use("/users", userRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "OK", service: "Payroll System API" });
});

export default app;
