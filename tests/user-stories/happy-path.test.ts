import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, test } from "node:test";
import request from "supertest";
import { app } from "../../src/app.ts";
import { requestCoalescerStore } from "../../src/store/coalescer.store.ts";
import { idempotencyStore } from "../../src/store/idempotency.store.ts";

beforeEach(() => {
  idempotencyStore.clear();
  requestCoalescerStore.clear();
});

test("User Story 1: processes first transaction with expected response", { timeout: 7000 }, async () => {
  const key = randomUUID();
  const start = Date.now();

  const response = await request(app)
    .post("/process-payment")
    .set("Idempotency-Key", key)
    .send({ amount: 100, currency: "GHS" });

  const elapsedMs = Date.now() - start;

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    success: true,
    message: "Charged 100 GHS",
  });
  assert.ok(elapsedMs >= 1900, `Expected ~2s processing delay, got ${elapsedMs}ms`);
});
