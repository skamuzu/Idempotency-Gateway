import { Router } from "express";
import { processPayment } from "./controller.ts";
import { validateSchema } from "./middleware/validation.middleware.ts";
import { idempotencyMiddleware } from "./middleware/idempotency.middleware.ts";
import { RequestSchema } from "./types.ts";

export const router = Router()

router.post(
	"/process-payment",
	validateSchema(RequestSchema),
	idempotencyMiddleware(),
	processPayment,
)