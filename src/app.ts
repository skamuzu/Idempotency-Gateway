import express, { Application } from "express";
import { router } from "./route.js";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./swagger.js";

export const app: Application = express();

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get("/openapi.json", (_req, res) => {
	res.status(200).json(openApiSpec);
});
app.use("", router);
