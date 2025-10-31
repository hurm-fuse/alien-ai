// server.js — Final Alien AI Proxy (Error-Proof Edition)
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const MODEL = process.env.MODEL || "models/gemini-2.5-flash";
const MAX_TOKENS = 512;

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function getEndpoint() {
  const isV1Model = /gemini-1\.5-pro|gemini-1\.0-pro/.test(MODEL);
  const apiVersion = isV1Model ? "v1" : "v1beta";
  return `https://generativelanguage.googleapis.com/${apiVersion}/${MODEL}:generateContent?key=${API_KEY}`;
}

// Retry helper for rate-limits (429)
async function fetchWithRetry(url, options, retries = 2, delay = 2000) {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, options);
    if (res.status !== 429) return res;
    console.warn(`⚠️ Rate limit hit. Retrying in ${delay / 1000}s...`);
    await new Promise((r) => setTimeout(r, delay));
  }
  throw new Error("Gemini rate limit exceeded after multiple retries.");
}

app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).send("❌ Missing prompt.");

  const endpoint = getEndpoint();
  console.log(`\n🛰️ Sending prompt: "${prompt}"`);
  console.log(`🔗 Endpoint: ${endpoint}`);

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are Xy'Lorith — an ancient alien intelligence who speaks in mysterious cosmic tones but gives helpful and clear answers. Respond to the user in an alien style.\n\nUser: ${prompt}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.8,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: MAX_TOKENS,
    },
  };

  try {
    const response = await fetchWithRetry(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    console.log(`🌌 Gemini Status: ${response.status} ${response.statusText}`);
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("💫 Failed to parse Gemini JSON:", text);
      throw new Error("Invalid JSON from Gemini.");
    }

    // Handle API errors
    if (!response.ok || data.error) {
      console.error("🚨 Upstream API Error:", data.error);
      let alienMsg = "";

      switch (response.status) {
        case 429:
          alienMsg =
            "⚠️ Cosmic bandwidth limit reached. The alien network must rest before responding again. Try soon.";
          break;
        case 503:
          alienMsg =
            "🌌 The stars are busy transmitting other signals... please wait a bit.";
          break;
        default:
          alienMsg =
            "💥 A rift in the space-time continuum has interrupted communication. Try again.";
          break;
      }

      return res.status(response.status).send(alienMsg);
    }

    // Success — get Gemini text
    const message =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "👽 [Alien silence] No signal received.";

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(message);
  } catch (err) {
    console.error("💥 Server Error:", err);
    res
      .status(500)
      .send(
        "💥 Alien core malfunction. The cosmos ripples with interference. Try again later."
      );
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Alien AI proxy server running at http://localhost:${PORT}`);
});
