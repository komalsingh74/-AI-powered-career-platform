import { GoogleGenAI } from "@google/genai";

const PRIMARY_MODEL = process.env.LLM_MODEL || "gemini-3.6-flash";
const REQUEST_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS) || 25_000;
const FALLBACK_MODELS = [
  ...(process.env.LLM_FALLBACK_MODELS || process.env.LLM_FALLBACK_MODEL || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean),
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let ai;

function getAiClient() {
  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { timeout: REQUEST_TIMEOUT_MS },
    });
  }
  return ai;
}

// Ye errors temporary hote hain, inpar dobara try karna theek hai
function isRetryable(err) {
  const status = Number(err?.status ?? err?.statusCode ?? err?.code);
  return (
    [408, 429, 500, 502, 503, 504].includes(status) ||
    ["ECONNRESET", "ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT"].includes(err?.code) ||
    /timed? ?out|timeout|fetch failed/i.test(err?.message || "")
  );
}

function getStatus(err) {
  const status = Number(err?.status ?? err?.statusCode ?? err?.code);
  return Number.isFinite(status) ? status : undefined;
}

async function callModel(model, contents, systemPrompt, maxOutputTokens) {
  const response = await getAiClient().models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens,
    },
  });
  const text = response.text?.trim();
  if (!text) throw new Error("Empty response from LLM");
  return text;
}

export async function requestLlmCompletion({
  messages,
  systemPrompt,
  maxOutputTokens = 1000,
}) {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error("LLM API key is not configured");
    error.statusCode = 500;
    throw error;
  }

  const contents = messages.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const models = [...new Set([PRIMARY_MODEL, ...FALLBACK_MODELS])];

  let lastError;

  for (const model of models) {
    // Har model par 3 koshish: turant, 1 sec baad, 2 sec baad
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await callModel(model, contents, systemPrompt, maxOutputTokens);
      } catch (err) {
        lastError = err;
        const status = getStatus(err);
        console.error(`LLM error (${model}, attempt ${attempt + 1}):`, status, err.message);
        // A 503 is a capacity signal for this model; fail over immediately.
        if (status === 503) break;
        if (!isRetryable(err)) break; // 400/404 jaise errors retry se theek nahi honge
        if (attempt < 2) await sleep(1000 * (attempt + 1));
      }
    }
  }

  const lastStatus = getStatus(lastError);
  const error = new Error(
    lastStatus === 429 || lastStatus === 503
      ? "The AI coach is busy right now. Please try again in a minute."
      : "AI coach is unavailable right now. Please try again."
  );
  error.statusCode = lastStatus === 429 || lastStatus === 503 ? lastStatus : 502;
  throw error;
}
