# Delhi Metro Rail Corporation (DMRC) — AI Voice & Transit Assistant

Official AI-powered transit web application and speech-to-speech voice assistant (**Chetna**) for the Delhi Metro Rail Corporation (DMRC).

Built with **React 19 + Vite + Tailwind CSS** (Frontend) and **FastAPI + Google ADK + Google Gemini Live + LangChain RAG** (Backend).

---

## Features

- **Real-Time Voice Assistant (Chetna)**:
  - Powered by **Google Gemini Live** (`gemini-3.8-live`) with Google ADK bidirectional WebSocket audio streaming.
  - Commuters can speak into their microphone or type questions during voice calls.
  - Automatic bilingual greeting upon connection (English / Hindi).
  - Streaming real-time subtitles and audio playback at 24kHz PCM with autoplay policy safeguards.
- **Text Chat & Smart Recommendations**:
  - Powered by `gemini-3.5-flash-lite` for instantaneous, grounded responses to routes, fares, timings, and policies.
  - Interactive suggestions and transit quick-links (Journey Planner, Fare Calculator, Line Status).
- **Interactive Metro Transit Web App**:
  - Live Line Status, interactive route map, station facilities search, token rules, and Smart Card / NCMC recharge guides.
- **Resilient Infrastructure**:
  - Session manager with automatic circuit-breaker fallback to in-memory sessions if Supabase PostgreSQL experiences connection drops.

---

## Project Structure

```
delhi-metro/
├── client/                     # React 19 + Vite Frontend Application
│   ├── src/
│   │   ├── features/
│   │   │   └── chetna/         # Chetna Voice & Chat Assistant Feature
│   │   │       ├── api/        # WebSocket and REST API connectors
│   │   │       ├── components/ # ChatPanel, CallScreen, VoiceBars, Tiles
│   │   │       ├── hooks/      # useVoiceCall, useChetna, useSpeechInput
│   │   │       └── context/    # ChetnaContext provider
│   │   ├── components/         # Shared Metro UI components
│   │   └── pages/              # Transit application pages
│   └── vite.config.js          # Vite config with /ws and /api proxy
│
└── server/
    └── S2S_Voice_Agent/        # FastAPI + Google ADK Voice Backend
        ├── app/
        │   ├── agent/          # Chetna ADK agent, instructions & tools
        │   ├── persistence/    # Resilient Supabase / In-Memory session service
        │   ├── rag/            # LangChain vector retrieval & search
        │   └── main.py         # FastAPI app, /ws/audio WebSocket & /api/chat
        ├── data/               # DMRC transit knowledge base
        ├── scripts/            # Ingestion and test scripts
        └── .env                # Gemini API key and model configuration
```

---

## Quick Start

### 1. Backend Server (FastAPI + Google ADK)

```bash
cd server/S2S_Voice_Agent

# Ensure .env is populated with GEMINI_API_KEY
# GEMINI_LIVE_MODEL=gemini-3.8-live
# GEMINI_TEXT_MODEL=gemini-3.5-flash-lite

# Run server using uv
uv run python -m app.main
```
The server will start at `http://localhost:8000`.

### 2. Frontend Client (React + Vite)

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Interacting with Chetna

1. Click the floating **Chetna** button in the bottom-right corner.
2. **For Voice Calling**:
   - Click **"Talk to Chetna"**.
   - Chetna will automatically greet you: *"Namaste! I'm Chetna from Delhi Metro..."*
   - Speak naturally or type any question into the call bar.
3. **For Text Chat**:
   - Ask any route or fare query: *"What is the fare from Rajiv Chowk to Noida Sector 18?"*
   - Receive instant answers with clickable journey links and suggestions.

