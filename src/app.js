import express from "express";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ipAddressMiddleware } from "./middleware/ipAddress.js";
import { logger } from "./utils/logger.js";

const app = express();

app.set("trust proxy", true);

app.use(express.json());
app.use(ipAddressMiddleware);
app.use("/api", routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

app.use(errorHandler);

export default app;
