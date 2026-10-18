import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";

import { createClient, FidgetLabsError } from "../index.js";

const fl = createClient({ baseUrl: process.env.FIDGETLABS_BASE_URL });

test("lists every offer in euros", async () => {
  const offers = await fl.listAllOffers();
  assert.ok(offers.length > 0);
  for (const o of offers) assert.equal(o.price.currency, "EUR");
});

test("pages with a cursor and loses nothing", async () => {
  const first = await fl.listOffers({ limit: 2 });
  assert.equal(first.data.length, 2);
  assert.ok(first.pagination.nextCursor);
  const second = await fl.listOffers({ limit: 2, cursor: first.pagination.nextCursor });
  assert.notEqual(second.data[0].slug, first.data[0].slug);
});

test("classifies and carries the disclaimer", async () => {
  const result = await fl.classifyEuAiActRisk(
    { size: "100_1000", industry: "hr_staffing", role: "director", transparencyInteraction: "yes", transparencyContent: "no", roleSignal: "builder", aiFrequency: "daily", annexDomains: ["employment"], biometricUse: "no", prohibited: [] },
    { idempotencyKey: "sdk-test-1" },
  );
  assert.equal(result.riskLevel, "high");
  assert.ok(result.disclaimer.length > 20);
});

test("throws a typed error with a stable code", async () => {
  await assert.rejects(fl.classifyEuAiActRisk({}), (e) => e instanceof FidgetLabsError && e.code === "invalid_answers" && e.status === 422);
});

test("CLI prints offers", () => {
  const out = execFileSync(process.execPath, ["bin/fidgetlabs.js", "offers"], { encoding: "utf8" });
  assert.match(out, /€/);
  assert.match(execFileSync(process.execPath, ["bin/fidgetlabs.js", "--version"], { encoding: "utf8" }), /^\d+\.\d+\.\d+/);
});
