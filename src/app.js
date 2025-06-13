import express from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import fs from "fs";
import path from "path";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ipAddressMiddleware } from "./middleware/ipAddress.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to merge all YAML files in src/docs/
function loadAndMergeSwaggerDocs(dirPath) {
  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".yaml"));
  let merged = {
    openapi: "3.0.0",
    info: {},
    paths: {},
    components: { schemas: {} },
    tags: [],
  };

  for (const file of files) {
    const doc = YAML.load(path.join(dirPath, file));
    // Merge paths
    if (doc.paths) {
      merged.paths = { ...merged.paths, ...doc.paths };
    }
    // Merge components.schemas
    if (doc.components && doc.components.schemas) {
      merged.components.schemas = {
        ...merged.components.schemas,
        ...doc.components.schemas,
      };
    }
    // Merge other components (optional: for parameters, securitySchemes, etc.)
    // Merge tags (avoid duplicates)
    if (doc.tags) {
      merged.tags = [
        ...merged.tags,
        ...doc.tags.filter(
          (tag) => !merged.tags.some((t) => t.name === tag.name)
        ),
      ];
    }
    // Use info from the first file or set your own
    if (!merged.info.title && doc.info) merged.info = doc.info;
  }
  return merged;
}
const swaggerDocument = loadAndMergeSwaggerDocs(path.join(__dirname, "docs"));

const app = express();

app.set("trust proxy", true);

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(ipAddressMiddleware);
app.use("/api", routes);

app.use(errorHandler);

export default app;
