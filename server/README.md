# Delhi Metro AI Voice & Chat Assistant ("Chetna")

A real-time, voice-first and bilingual conversational assistant for the **Delhi Metro Rail Corporation (DMRC)**, powered by **Google ADK + Google Gemini Live + Direct Gemini API + LangChain RAG + Supabase PostgreSQL (pgvector + HNSW)**.

Chetna provides instantaneous assistance for Delhi Metro commuters: routes, fares, line status, interchange stations, smart card recharging, token rules, first/last train timings, station facilities (lifts, parking), and lost & found procedures. Commuters can interact via natural bilingual voice calls (English / Hindi) or structured text chat.

---

## 1. System Architecture

The project consists of two core subsystems:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Delhi Metro Frontend Client                     │
│       React 19 + Vite + Tailwind CSS + Lucide Icons + Web Audio API    │
│                                                                        │
│   • Chetna Widget: Interactive floating launcher & bilingual assistant │
│   • Voice Call Screen: Dual input (Mic PCM 16kHz + In-call text input) │
│   • Real-Time Audio Playback: 24kHz raw PCM sequential scheduling       │
│   • Text Chat & Journey Planner: Fare calculator, route recommendations│
└───────────────────▲────────────────────────────────┬───────────────────┘
                    │ WebSocket (/ws/audio)          │ HTTP POST (/api/chat)
                    │ Bidirectional Audio Stream      │ REST / SSE
┌───────────────────┴────────────────────────────────▼───────────────────┐
│                    FastAPI Backend (S2S Voice Agent)                   │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Voice Call Runtime (Gemini Live)                                    │
│    • Google ADK Runner + LiveRequestQueue                              │
│    • Model: Configured via `GEMINI_LIVE_MODEL` (e.g. `gemini-3.8-live`) │
│    • Speech Config: Prebuilt Voice "Aoede"                             │
│    • Live Audio Streaming: 24kHz raw PCM output to browser speakers    │
│    • Real-Time Transcription: Streaming agent output & user speech     │
│    • Auto Greeting: Instant bilingual greeting upon connection         │
│                                                                        │
│ 2. Text Chat Runtime                                                   │
│    • Direct `google.genai.Client` with retry resilience                │
│    • Model: Strictly configured via `GEMINI_TEXT_MODEL`                │
│             (e.g. `gemini-3.5-flash-lite`)                             │
│    • Flow Detection: Regex intent recognition for transit quick-links  │
│                                                                        │
│ 3. Persistence & Resilience                                            │
│    • ResilientSessionService: Hybrid Supabase + Fast InMemory fallback │
│    • Instant recovery if Supabase network / DNS encounters issues      │
│                                                                        │
│ 4. RAG Knowledge Base                                                  │
│    • DMRC Transit Data (stations, fares, timings, facilities)          │
│    • LangChain PGVector + HNSW index + `gemini-embedding-001`          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Model Configuration & Compliance

The system strictly adheres to the models declared in `.env`:

| Mode | Environment Variable | Configured Model | Purpose |
|---|---|---|---|
| **Voice Calling** | `GEMINI_LIVE_MODEL` | `gemini-3.8-live` | Real-time speech-to-speech bidirectional voice call over WebSockets. |
| **Text Chat** | `GEMINI_TEXT_MODEL` | `gemini-3.5-flash-lite` | Instant text query answering with high availability and speed. |
| **Embeddings** | `EMBEDDING_MODEL` | `models/gemini-embedding-001` | 768-dimensional vector representations for DMRC knowledge. |

---

## 3. Key Features

- **Bidirectional Voice Calling (Gemini Live)**:
  - Streams microphone audio (16kHz PCM) directly to Gemini Live.
  - Receives and sequentially schedules 24kHz raw PCM audio for crystal-clear playback.
  - Browser Autoplay Policy Protection: Proactively unlocks `AudioContext` on user gesture.
  - Live Subtitles: Displays real-time streaming transcripts of both passenger and Chetna.
  - Dual Input Mode: Commuters can speak into their microphone or type questions while in call.
- **Instant Automatic Greeting**:
  - Automatically greets the commuter in English or Hindi immediately upon call connection.
- **Fast Text & Streaming Chat**:
  - Answers route queries, token rules, and fare calculations with zero latency.
  - Interactive transit chips and deep-links (Journey Planner, Fare Calculator).
- **Network Resilience & Circuit Breaker**:
  - `ResilientSessionService` dynamically falls back to an in-memory session store if Supabase database DNS/network fails, ensuring the voice agent never drops a call.

---

## 4. Getting Started

### Prerequisites

1. **Python**: `>= 3.14` (managed using `uv`)
2. **Node.js**: `>= 18` (managed using `npm`)
3. **Google Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd server/S2S_Voice_Agent
   ```
2. Configure `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_LIVE_MODEL=gemini-3.8-live
   GEMINI_TEXT_MODEL=gemini-3.5-flash-lite
   EMBEDDING_MODEL=models/gemini-embedding-001
   SUPABASE_DATABASE_URL=postgresql://user:password@host:5432/postgres
   SERVER_HOST=0.0.0.0
   SERVER_PORT=8000
   ```
3. Install dependencies and start the backend:
   ```bash
   uv run python -m app.main
   ```
   The backend server runs on `http://localhost:8000`.

### Frontend Setup

1. In a separate terminal, navigate to the client:
   ```bash
   cd client
   npm install
   npm run dev
   ```
2. Open `http://localhost:5173` in your browser.
3. Click the **Chetna** floating button in the bottom right corner:
   - Click **"Talk to Chetna"** to start a voice call.
   - Or type in the text chat to plan journeys and calculate fares.

---

## 5. API Reference

### 1. Real-time Audio WebSocket
- **URL**: `ws://localhost:8000/ws/audio`
- **Client Messages**:
  - `{"type": "init", "lang": "en" | "hi"}`: Dispatched upon connect to trigger Chetna's greeting.
  - `{"type": "audio", "data": "<base64 PCM 16kHz>"}`: Continuous microphone audio.
  - `{"type": "text", "text": "..."}`: In-call typed question.
  - `{"type": "stop"}`: Ends the call session.
- **Server Messages**:
  - `{"type": "audio", "data": "<base64 PCM 24kHz>"}`: Synthesized speech from Chetna.
  - `{"type": "transcript_agent", "text": "..."}`: Streaming partial transcript.
  - `{"type": "transcript_agent_final", "text": "..."}`: Completed sentence transcript.
  - `{"type": "transcript_user", "text": "...", "finished": bool}`: Commuter speech transcription.
  - `{"type": "tool_call", "tool": "..."}`: Status when checking knowledge tools.

### 2. Text Chat Endpoint
- **URL**: `POST /api/chat`
- **Body**:
  ```json
  {
    "message": "What is the fare from Rajiv Chowk to Kashmere Gate?"
  }
  ```
- **Response**:
  ```json
  {
    "response": "Namaste! The fare from Rajiv Chowk to Kashmere Gate is 30 rupees...",
    "reply": "Namaste! The fare from Rajiv Chowk to Kashmere Gate is 30 rupees...",
    "session_id": "...",
    "flow": "fare",
    "suggestions": [{"label": "Journey Planner", "flow": "journey"}]
  }
  ```

---

## 6. Testing

Run automated tests:

```bash
# Test WebSocket Live Calling
uv run python -c "
import asyncio, json, websockets
async def test():
    async with websockets.connect('ws://localhost:8000/ws/audio') as ws:
        await ws.send(json.dumps({'type': 'init', 'lang': 'en'}))
        msg = json.loads(await ws.recv())
        print('Live response received:', msg.get('type'))
        await ws.send(json.dumps({'type': 'stop'}))
asyncio.run(test())
"

# Test Text Chat API
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What lines connect to Central Secretariat?"}'
```
