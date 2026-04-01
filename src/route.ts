import { Router } from "express";
import { processPayment } from "./controller.js";
import { validateSchema } from "./middleware/validation.middleware.js";
import { idempotencyMiddleware } from "./middleware/idempotency.middleware.js";
import { RequestSchema } from "./types.js";

export const router = Router()

router.post(
	"/process-payment",
	validateSchema(RequestSchema),
	idempotencyMiddleware(),
	processPayment,
)