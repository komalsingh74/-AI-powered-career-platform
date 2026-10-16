import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

try {
  const res = await ai.models.generateContent({
    model: process.env.LLM_MODEL || "gemini-2.5-flash",
    contents: "Say hello in one line",
  });
  console.log("OK:", res.text);
} catch (err) {
  console.log("STATUS:", err.status);
  console.log("MESSAGE:", err.message);
}