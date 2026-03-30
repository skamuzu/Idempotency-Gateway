import { RequestHandler, Response, NextFunction, Request } from "express";
import * as z from "zod";
import { idempotencyStore } from "../store/idempotency.store.ts";
import { requestCoalescerStore } from "../store/coalescer.store.ts";
import { hashRequest, replayCachedResponse } from "../utils.ts";

const UUIDSchema = z.uuid();

export const idempotencyMiddleware = (): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const keyHeader = req.get("Idempotency-Key");

    if (!keyHeader) {
      return res.status(400).json({
        error: "Missing idempotency key",
        message: `The Idempotency-Key header is required for POST requests`,
      });
    }

    if (!UUIDSchema.safeParse(keyHeader).success) {
      return res.status(400).json({
        error: "Invalid idempotency key format",
        message:
          "Key must be 16-64 alphanumeric characters, hyphens, or underscores",
      });
    }

    const compositeKey = `${req.method}:${req.path}:${keyHeader}`;
    const requestHash = hashRequest(req.body);

    const existing = idempotencyStore.get(compositeKey);

    if (existing) {
      if (existing.requestHash !== requestHash) {
        return res.status(422).json({
          message: "Idempotency key already used for a different request body.",
        });
      }

      if (existing.response) {
        return replayCachedResponse(res, existing.response);
      }

      const waitPromise = requestCoalescerStore.wait(compositeKey);
      if (waitPromise) {
        await waitPromise;
      }

      const completed = idempotencyStore.get(compositeKey);

      if (completed?.response) {
        return replayCachedResponse(res, completed.response);
      }

      return res.status(500).json({
        error: "Request could not be replayed",
        message: "Original request did not complete successfully",
      });
    }

    idempotencyStore.set(compositeKey, {
      requestHash,
    });
    requestCoalescerStore.begin(compositeKey);

    const originalJson = res.json.bind(res);
    let captured = false;

    res.json = ((body: unknown) => {
      if (captured) {
        return originalJson(body);
      }

      captured = true;
      idempotencyStore.set(compositeKey, {
        requestHash,
        response: {
          body,
          statusCode: res.statusCode,
          headers: res.getHeaders(),
        },
      });
      requestCoalescerStore.complete(compositeKey);

      return originalJson(body);
    }) as Response["json"];

    res.on("close", () => {
      if (!captured) {
        requestCoalescerStore.complete(compositeKey);
      }
    });

    next();
  };
};
