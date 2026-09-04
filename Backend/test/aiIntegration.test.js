const test = require("node:test");
const assert = require("node:assert/strict");

process.env.AI_SERVICE_URL = "http://localhost:8000";
const { requestRecommendations } = require("../services/aiService");
const { buildSupplierPayload, buildRecipientPayload } = require("../services/aiDataAdapter");

const request = {
  requestId: "REQ001", hospitalId: "H010", medicine: "Insulin", quantity: 80,
  urgency: "HIGH", location: "Matara", province: "Southern", requiredBy: "2026-09-15T00:00:00.000Z", status: "open",
};
const stock = {
  stockId: "STK001", hospitalId: "H001", medicine: "Insulin", quantity: 120,
  reservedQuantity: 0, location: "Colombo", province: "Western", expiryDate: "2027-02-10T00:00:00.000Z", status: "available",
};

test("supplier and recipient adapters produce the exact AI contract", () => {
  assert.deepEqual(buildSupplierPayload(request, [stock]), {
    request: { ...request, requiredBy: "2026-09-15" },
    availableStock: [{ stockId: "STK001", hospitalId: "H001", medicine: "Insulin", quantity: 120, location: "Colombo", province: "Western", expiryDate: "2027-02-10", status: "available" }],
    limit: 5,
  });
  assert.deepEqual(buildRecipientPayload(stock, [request]), {
    stock: { stockId: "STK001", hospitalId: "H001", medicine: "Insulin", quantity: 120, location: "Colombo", province: "Western", expiryDate: "2027-02-10", status: "available" },
    openRequests: [{ ...request, requiredBy: "2026-09-15" }],
    limit: 5,
  });
});

test("AI client posts to the configured endpoint and preserves valid response", async () => {
  let captured;
  const result = await requestRecommendations("/api/v1/recommend/suppliers", { request, availableStock: [stock], limit: 5 }, async (url, options) => {
    captured = { url, options };
    return { ok: true, json: async () => ({ requestId: "REQ001", recommendations: [{ hospitalId: "H001", matchScore: 96, reasons: ["Medicine match"] }] }) };
  });
  assert.equal(captured.url, "http://localhost:8000/api/v1/recommend/suppliers");
  assert.equal(captured.options.method, "POST");
  assert.deepEqual(JSON.parse(captured.options.body), { request, availableStock: [stock], limit: 5 });
  assert.equal(result.recommendations[0].matchScore, 96);
});

test("AI client normalizes connection failures and invalid responses", async () => {
  await assert.rejects(() => requestRecommendations("/api/v1/recommend/recipients", {}, async () => { throw new Error("connection refused"); }), { code: "AI_SERVICE_UNAVAILABLE" });
  await assert.rejects(() => requestRecommendations("/api/v1/recommend/recipients", {}, async () => ({ ok: true, json: async () => ({ nope: true }) })), { code: "AI_SERVICE_UNAVAILABLE" });
});

test("AI client converts aborts into timeout failures", async () => {
  const fetchMock = (_url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
  });
  await assert.rejects(() => requestRecommendations("/api/v1/recommend/suppliers", {}, fetchMock, 1), { code: "AI_SERVICE_UNAVAILABLE", message: "AI service request timed out" });
});