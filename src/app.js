import express from "express";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ipAddressMiddleware } from "./middleware/ipAddress.js";

const app = express();

app.set("trust proxy", true);

app.use(express.json());
app.use(ipAddressMiddleware);
app.use("/api", routes);

app.use(errorHandler);

export default app;
