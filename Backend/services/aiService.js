const DEFAULT_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 5000;

const aiServiceUrl = () => {
  if (!process.env.AI_SERVICE_URL) throw new Error("AI_SERVICE_URL is not configured");
  return process.env.AI_SERVICE_URL.replace(/\/$/, "");
};

const requestRecommendations = async (path, payload, fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${aiServiceUrl()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`AI service returned HTTP ${response.status}`);
    let result;
    try { result = await response.json(); } catch (error) { throw new Error("AI service returned invalid JSON"); }
    if (!result || typeof result !== "object" || !Array.isArray(result.recommendations)) throw new Error("AI service returned an invalid recommendation response");
    return result;
  } catch (error) {
    const serviceError = new Error(error.name === "AbortError" ? "AI service request timed out" : error.message || "AI service request failed");
    serviceError.code = "AI_SERVICE_UNAVAILABLE";
    throw serviceError;
  } finally { clearTimeout(timeout); }
};

module.exports = { requestRecommendations, DEFAULT_TIMEOUT_MS };