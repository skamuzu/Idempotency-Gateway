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

test("User Story 2: duplicate request returns cached response without re-processing", { timeout: 7000 }, async () => {
  const key = randomUUID();
  const payload = { amount: 100, currency: "GHS" };

  const firstStart = Date.now();
  const firstResponse = await request(app)
    .post("/process-payment")
    .set("Idempotency-Key", key)
    .send(payload);
  const firstElapsedMs = Date.now() - firstStart;

  const secondStart = Date.now();
  const secondResponse = await request(app)
    .post("/process-payment")
    .set("Idempotency-Key", key)
    .send(payload);
  const secondElapsedMs = Date.now() - secondStart;

  assert.equal(firstResponse.status, 200);
  assert.equal(secondResponse.status, firstResponse.status);
  assert.deepEqual(secondResponse.body, firstResponse.body);
  assert.equal(secondResponse.headers["x-cache-hit"], "true");

  assert.ok(firstElapsedMs >= 1900, `Expected first request to take ~2s, got ${firstElapsedMs}ms`);
  assert.ok(secondElapsedMs < 500, `Expected replay to be fast, got ${secondElapsedMs}ms`);
});

test("User Story 3: same key with different payload is rejected", { timeout: 7000 }, async () => {
  const key = randomUUID();

  await request(app)
    .post("/process-payment")
    .set("Idempotency-Key", key)
    .send({ amount: 100, currency: "GHS" });

  const conflictResponse = await request(app)
    .post("/process-payment")
    .set("Idempotency-Key", key)
    .send({ amount: 500, currency: "GHS" });

  assert.equal(conflictResponse.status, 422);
  assert.equal(
    conflictResponse.body.message,
    "Idempotency key already used for a different request body.",
  );
});

test("Bonus story: in-flight duplicate waits and reuses original response", { timeout: 7000 }, async () => {
  const key = randomUUID();
  const payload = { amount: 100, currency: "GHS" };

  const start = Date.now();

  const requestA = request(app)
    .post("/process-payment")
    .set("Idempotency-Key", key)
    .send(payload);

  const requestB = request(app)
    .post("/process-payment")
    .set("Idempotency-Key", key)
    .send(payload);

  const [responseA, responseB] = await Promise.all([requestA, requestB]);
  const elapsedMs = Date.now() - start;

  assert.equal(responseA.status, 200);
  assert.equal(responseB.status, 200);
  assert.deepEqual(responseB.body, responseA.body);
  assert.equal(responseB.headers["x-cache-hit"], "true");

  assert.ok(elapsedMs >= 1900, `Expected coalesced flow to wait for first request, got ${elapsedMs}ms`);
  assert.ok(elapsedMs < 3500, `Expected no double processing delay, got ${elapsedMs}ms`);
});
