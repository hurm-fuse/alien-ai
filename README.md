# Alien AI Assistant (Node + Express + Static Frontend)

## What this is
A small Node.js + Express proxy and static frontend that demonstrates how to call the Google Gemini generative API (models like `models/gemini-2.5-flash`) using a structured JSON body as requested.

The server proxies requests (so your API key is kept on the server). The frontend is an alien-themed chat UI that is responsive.

## Setup (quick)
1. Copy `.env.example` to `.env` and set `API_KEY` and `MODEL`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run:
   ```bash
   npm start
   ```
4. Open `http://localhost:3000` in your browser.

## Notes
- The server builds the endpoint using the exact logic you provided:
  ```js
  const isV1Model = /gemini-1\.5-pro|gemini-1\.0-pro/.test(MODEL);
  const apiVersion = isV1Model ? 'v1' : 'v1beta';
  const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/${MODEL}:generateContent?key=${API_KEY}`;
  ```
- Replace `API_KEY` in your `.env`. Do not commit secrets.
- This project is a starter. You can enhance client-side parsing, streaming, and more advanced UI features.
