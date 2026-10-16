"""
Main application module.

Provides the FastAPI server with WebSocket endpoint for Gemini Live
bidirectional audio streaming, plus the ADK web UI integration.
"""

import asyncio
import base64
import json
import logging
import os
import uuid
from contextlib import asynccontextmanager

from app.database.connection import configure_windows_event_loop

# On Windows, psycopg async requires SelectorEventLoop instead of ProactorEventLoop
configure_windows_event_loop()

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator
from app.metro import router as metro_router

from google.adk import Runner
from google.adk.agents import LiveRequestQueue
from google.adk.runners import RunConfig
from google.genai import types as genai_types
import google.genai as genai

from app.agent.agent import create_agent
from app.config import (
    GEMINI_API_KEY,
    GEMINI_LIVE_MODEL,
    GEMINI_TEXT_MODEL,
    SERVER_HOST,
    SERVER_PORT,
    log_config_summary,
    validate_config,
)
from app.persistence.sessions import (
    get_active_session_id,
    get_session_service,
    reset_active_session,
    resolve_session_id,
    set_active_session_id,
)

logger = logging.getLogger(__name__)

# Application name constant
APP_NAME = "trijotech-voice-agent"
TEXT_API_USER_ID = "text_api_user"


def _genai_client() -> genai.Client:
    """Return a google.genai Client configured with the API key from .env."""
    return genai.Client(api_key=GEMINI_API_KEY)


import re

class ChatRequest(BaseModel):
    """Request body for a turn in the text conversation."""

    message: str = Field(min_length=1, max_length=10000)
    session_id: str | None = None
    thread_id: str | None = None
    lang: str | None = "en"
    channel: str | None = "text"

    @field_validator("message")
    @classmethod
    def strip_message(cls, message: str) -> str:
        """Remove surrounding whitespace and reject blank chat turns."""
        message = message.strip()
        if not message:
            raise ValueError("message must not be blank")
        return message

    @field_validator("session_id", "thread_id")
    @classmethod
    def validate_session_ids(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip()
        if not v:
            raise ValueError("session_id must not be blank")
        return v

    def get_session_id(self) -> str | None:
        sid = self.session_id or self.thread_id
        if sid:
            sid = sid.strip()
            return sid if sid else None
        return None


class ChatResponse(BaseModel):
    """Text response and conversation identifier."""

    response: str
    reply: str
    session_id: str
    flow: str | None = None
    suggestions: list[dict] | None = None

class ResetSessionRequest(BaseModel):
    session_id: str | None = None


def detect_metro_flow(msg: str) -> tuple[str | None, list[dict] | None]:
    q = msg.lower()
    if re.search(r"\b(fare|ticket fare|price|cost|charge|kitna)\b", q):
        return "fare", [{"label": "Journey Planner", "flow": "journey"}]
    if re.search(r"\b(route|journey|reach|travel|plan|direction)\b", q):
        return "journey", [{"label": "Calculate Fare", "flow": "fare"}]
    if re.search(r"\b(ticket|book|qr)\b", q):
        return "ticket", [{"label": "Journey Planner", "flow": "journey"}]
    if re.search(r"\b(status|delay|running|disrupt)\b", q):
        return "status", None
    if re.search(r"\b(station|gate|facility|facilities|lift|parking)\b", q):
        return "station", None
    if re.search(r"\b(lost|found|left behind|forgot)\b", q):
        return "lostfound", None
    if re.search(r"\b(help|contact|helpline|complaint|feedback)\b", q):
        return "help", None
    return None, None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    logger.info("Starting TrijoTech Voice Agent...")

    errors = validate_config()
    if errors:
        for err in errors:
            logger.error("Configuration error: %s", err)
        logger.error("Fix the above errors before starting.")
    else:
        log_config_summary()
        logger.info("Configuration validated successfully.")

    # Set API key
    if GEMINI_API_KEY:
        os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY
        os.environ.pop("GEMINI_API_KEY", None)

    yield

    # Shutdown
    logger.info("Shutting down TrijoTech Voice Agent...")


app = FastAPI(
    title="Delhi Metro Chetna AI Agent",
    description="Real-time voice and text transit assistant powered by Google ADK + Gemini Live",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metro_router)


# HTML page for the voice agent interface
VOICE_UI_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TrijoTech Voice Agent</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0d0d2b 100%);
            color: #e0e0e0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            padding: 2rem;
            max-width: 600px;
        }
        h1 {
            font-size: 2rem;
            background: linear-gradient(135deg, #60a5fa, #a78bfa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }
        .subtitle {
            color: #8888aa;
            margin-bottom: 2rem;
            font-size: 0.95rem;
        }
        #status {
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            margin-bottom: 2rem;
            font-size: 0.9rem;
        }
        .btn {
            padding: 1rem 2.5rem;
            border: none;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 0.5rem;
        }
        .btn-start {
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        }
        .btn-start:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 30px rgba(59, 130, 246, 0.5);
        }
        .btn-stop {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
        }
        .btn-stop:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 30px rgba(239, 68, 68, 0.5);
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
        }
        .pulse {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
            vertical-align: middle;
        }
        .pulse-active {
            background: #22c55e;
            animation: pulse 1.5s infinite;
        }
        .pulse-inactive {
            background: #6b7280;
        }
        .pulse-connecting {
            background: #f59e0b;
            animation: pulse 0.8s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
        }
        .transcript {
            margin-top: 2rem;
            text-align: left;
            max-height: 300px;
            overflow-y: auto;
            padding: 1rem;
            background: rgba(0,0,0,0.3);
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.05);
            font-size: 0.85rem;
            line-height: 1.6;
        }
        .transcript .user { color: #60a5fa; }
        .transcript .agent { color: #a78bfa; }
        .transcript .system { color: #6b7280; font-style: italic; }
        .info {
            margin-top: 1.5rem;
            font-size: 0.8rem;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>TrijoTech Voice Agent</h1>
        <p class="subtitle">Powered by Google ADK + Gemini Live</p>
        
        <div id="status">
            <span class="pulse pulse-inactive" id="statusDot"></span>
            <span id="statusText">Ready to connect</span>
        </div>

        <div>
            <button class="btn btn-start" id="startBtn" onclick="startConversation()">
                🎤 Start Conversation
            </button>
            <button class="btn btn-stop" id="stopBtn" onclick="stopConversation()" disabled>
                ⏹ End Conversation
            </button>
        </div>

        <div class="transcript" id="transcript"></div>
        
        <p class="info">
            Ensure microphone permissions are granted. 
            Speak naturally — Trija will respond via voice.
        </p>
    </div>

    <script>
        let ws = null;
        let mediaStream = null;
        let audioContext = null;
        let processor = null;
        let playbackContext = null;
        let nextStartTime = 0;
        let activeSources = [];
        let currentAgentP = null;
        let currentUserP = null;

        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const transcript = document.getElementById('transcript');

        function setStatus(state, text) {
            statusDot.className = 'pulse pulse-' + state;
            statusText.textContent = text;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function addTranscript(role, text) {
            currentAgentP = null;
            currentUserP = null;
            const p = document.createElement('p');
            p.className = role;
            const label = role === 'user' ? '🧑 You' : role === 'agent' ? '🤖 Trija' : '⚙️ System';
            p.innerHTML = '<strong>' + label + ':</strong> ' + escapeHtml(text);
            transcript.appendChild(p);
            transcript.scrollTop = transcript.scrollHeight;
            return p;
        }

        function appendAgentTranscript(text) {
            currentUserP = null;
            if (!currentAgentP) {
                currentAgentP = document.createElement('p');
                currentAgentP.className = 'agent';
                currentAgentP.innerHTML = '<strong>🤖 Trija:</strong> <span></span>';
                transcript.appendChild(currentAgentP);
            }
            const span = currentAgentP.querySelector('span');
            span.textContent += text;
            transcript.scrollTop = transcript.scrollHeight;
        }

        function finalizeAgentTranscript(text) {
            if (currentAgentP && text) {
                const span = currentAgentP.querySelector('span');
                if (text.length >= span.textContent.length) {
                    span.textContent = text;
                }
            } else if (text) {
                appendAgentTranscript(text);
            }
            currentAgentP = null;
            transcript.scrollTop = transcript.scrollHeight;
        }

        function appendUserTranscript(text) {
            currentAgentP = null;
            if (!currentUserP) {
                currentUserP = document.createElement('p');
                currentUserP.className = 'user';
                currentUserP.innerHTML = '<strong>🧑 You:</strong> <span></span>';
                transcript.appendChild(currentUserP);
            }
            const span = currentUserP.querySelector('span');
            span.textContent = text;
            transcript.scrollTop = transcript.scrollHeight;
        }

        async function startConversation() {
            try {
                setStatus('connecting', 'Connecting...');
                startBtn.disabled = true;

                currentAgentP = null;
                currentUserP = null;
                nextStartTime = 0;

                // Get microphone
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        sampleRate: 16000,
                        channelCount: 1,
                        echoCancellation: true,
                        noiseSuppression: true,
                    }
                });

                // Setup audio processing
                audioContext = new AudioContext({ sampleRate: 16000 });
                const source = audioContext.createMediaStreamSource(mediaStream);
                processor = audioContext.createScriptProcessor(4096, 1, 1);

                // Mute gain node to prevent mic loopback into local speakers
                const muteNode = audioContext.createGain();
                muteNode.gain.value = 0;
                
                // Connect to WebSocket
                const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
                ws = new WebSocket(protocol + '//' + location.host + '/ws/audio');

                ws.onopen = () => {
                    setStatus('active', 'Connected — speak now');
                    stopBtn.disabled = false;
                    addTranscript('system', 'Connected to voice agent');

                    // Start sending audio without playing mic into speakers
                    source.connect(processor);
                    processor.connect(muteNode);
                    muteNode.connect(audioContext.destination);

                    processor.onaudioprocess = (e) => {
                        if (ws && ws.readyState === WebSocket.OPEN) {
                            const float32 = e.inputBuffer.getChannelData(0);
                            const int16 = new Int16Array(float32.length);
                            for (let i = 0; i < float32.length; i++) {
                                int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
                            }
                            const b64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
                            ws.send(JSON.stringify({ type: 'audio', data: b64 }));
                        }
                    };
                };

                ws.onmessage = (event) => {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'audio') {
                        playAudio(msg.data);
                    } else if (msg.type === 'transcript_agent') {
                        appendAgentTranscript(msg.text);
                    } else if (msg.type === 'transcript_agent_final') {
                        finalizeAgentTranscript(msg.text);
                    } else if (msg.type === 'transcript_user') {
                        appendUserTranscript(msg.text);
                    } else if (msg.type === 'tool_call') {
                        addTranscript('system', 'Using tool: ' + msg.tool);
                    } else if (msg.type === 'error') {
                        addTranscript('system', 'Error: ' + msg.message);
                    }
                };

                ws.onclose = () => {
                    setStatus('inactive', 'Disconnected');
                    addTranscript('system', 'Connection closed');
                    cleanup();
                };

                ws.onerror = (err) => {
                    setStatus('inactive', 'Connection error');
                    addTranscript('system', 'Connection error occurred');
                    cleanup();
                };

            } catch (err) {
                setStatus('inactive', 'Failed to start');
                addTranscript('system', 'Error: ' + err.message);
                startBtn.disabled = false;
            }
        }

        function playAudio(base64Data) {
            if (!playbackContext) {
                playbackContext = new AudioContext({ sampleRate: 24000 });
            }
            if (playbackContext.state === 'suspended') {
                playbackContext.resume();
            }

            const binaryStr = atob(base64Data);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }
            const int16 = new Int16Array(bytes.buffer);
            const float32 = new Float32Array(int16.length);
            for (let i = 0; i < int16.length; i++) {
                float32[i] = int16[i] / 32768.0;
            }
            const buffer = playbackContext.createBuffer(1, float32.length, 24000);
            buffer.getChannelData(0).set(float32);
            const source = playbackContext.createBufferSource();
            source.buffer = buffer;
            source.connect(playbackContext.destination);

            // Sequential timeline scheduling
            const now = playbackContext.currentTime;
            if (nextStartTime < now) {
                nextStartTime = now;
            }
            source.start(nextStartTime);
            nextStartTime += buffer.duration;

            activeSources.push(source);
            source.onended = () => {
                const idx = activeSources.indexOf(source);
                if (idx !== -1) {
                    activeSources.splice(idx, 1);
                }
            };
        }

        function stopAllAudio() {
            for (const s of activeSources) {
                try { s.stop(); } catch (e) {}
            }
            activeSources = [];
            if (playbackContext) {
                nextStartTime = playbackContext.currentTime;
            } else {
                nextStartTime = 0;
            }
        }

        function stopConversation() {
            if (ws) {
                ws.send(JSON.stringify({ type: 'stop' }));
                ws.close();
            }
            cleanup();
        }

        function cleanup() {
            stopAllAudio();
            if (processor) { processor.disconnect(); processor = null; }
            if (audioContext) { audioContext.close(); audioContext = null; }
            if (playbackContext) { playbackContext.close(); playbackContext = null; }
            if (mediaStream) {
                mediaStream.getTracks().forEach(t => t.stop());
                mediaStream = null;
            }
            ws = null;
            nextStartTime = 0;
            currentAgentP = null;
            currentUserP = null;
            startBtn.disabled = false;
            stopBtn.disabled = true;
            setStatus('inactive', 'Ready to connect');
        }
    </script>
</body>
</html>
"""


@app.get("/", response_class=HTMLResponse)
async def index():
    """Serve the voice agent web interface."""
    return VOICE_UI_HTML


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "agent": "chetna-metro-agent"}


@app.post("/api/chat", response_model=ChatResponse)
async def text_chat(request: ChatRequest) -> ChatResponse:
    """Single text turn using Google ADK Runner with session continuity and web search."""
    flow, suggestions = detect_metro_flow(request.message)
    session_service = get_session_service()

    raw_sid = request.get_session_id()
    if raw_sid:
        session = await session_service.get_session(
            app_name=APP_NAME,
            user_id=TEXT_API_USER_ID,
            session_id=raw_sid,
        )
        if session is None:
            resolved_sid = resolve_session_id(raw_sid)
            if resolved_sid != raw_sid:
                session = await session_service.get_session(
                    app_name=APP_NAME,
                    user_id=TEXT_API_USER_ID,
                    session_id=resolved_sid,
                )
            if session is None:
                if raw_sid == "unknown":
                    raise HTTPException(status_code=404, detail="Session not found")
                session = await session_service.create_session(
                    app_name=APP_NAME,
                    user_id=TEXT_API_USER_ID,
                    session_id=raw_sid,
                )
    else:
        session = await session_service.create_session(
            app_name=APP_NAME,
            user_id=TEXT_API_USER_ID,
        )

    session_id = session.id
    set_active_session_id(session_id)

    from app.agent.instructions import AGENT_INSTRUCTIONS

    text_instructions = (
        AGENT_INSTRUCTIONS
        + "\n\n## Text Formatting Guidelines:\n"
        + "- Always structure your reply with clear paragraphs separated by blank lines.\n"
        + "- When providing routes, travel steps, or station guidance, use numbered points (e.g., '1. **Boarding Station:** ...') or bullet items, each separated by blank lines so they never cluster together.\n"
        + "- Bold important station names, metro line colors (e.g. **Airport Express Line**, **Yellow Line**), fares (e.g. **60 rupees**), and journey times.\n"
        + "- Keep explanations concise, pleasant, and easy to read on mobile and desktop screens."
    )

    agent = create_agent(model=GEMINI_TEXT_MODEL)
    if hasattr(agent, "instruction"):
        agent.instruction = text_instructions

    runner = Runner(
        agent=agent,
        app_name=APP_NAME,
        session_service=session_service,
    )

    content = genai_types.Content(
        role="user",
        parts=[genai_types.Part.from_text(text=request.message)],
    )

    response_text = ""
    MAX_RETRIES = 2
    for attempt in range(MAX_RETRIES):
        try:
            logger.info("text_chat ADK runner attempt=%d session=%s", attempt + 1, session_id)
            final_text_parts = []
            all_text_parts = []
            async for event in runner.run_async(
                user_id=TEXT_API_USER_ID,
                session_id=session_id,
                new_message=content,
            ):
                is_final = False
                if hasattr(event, "is_final_response") and callable(event.is_final_response):
                    is_final = event.is_final_response()

                if hasattr(event, "content") and event.content and hasattr(event.content, "parts"):
                    for part in event.content.parts:
                        txt = getattr(part, "text", None)
                        if txt:
                            all_text_parts.append(txt)
                            if is_final:
                                final_text_parts.append(txt)

            if final_text_parts:
                response_text = "".join(final_text_parts).strip()
            elif all_text_parts:
                response_text = "".join(all_text_parts).strip()

            if response_text:
                break
        except Exception as err:
            err_str = str(err)
            if "503" in err_str or "UNAVAILABLE" in err_str:
                if attempt < MAX_RETRIES - 1:
                    logger.warning("503 on ADK text_chat attempt %d — retrying in 2s", attempt + 1)
                    await asyncio.sleep(2)
                else:
                    logger.warning("503 on ADK text_chat exhausted")
            else:
                logger.error("Error from ADK text_chat: %s", err_str, exc_info=True)
                break

    if not response_text:
        response_text = "Delhi Metro assistance is currently experiencing high demand. Please try again or call the DMRC 24/7 helpline at 155370."

    return ChatResponse(
        response=response_text,
        reply=response_text,
        session_id=session_id,
        flow=flow,
        suggestions=suggestions,
    )


@app.post("/api/chat/stream")
async def stream_chat(request: ChatRequest):
    """Streaming SSE chat using Google ADK Runner with session continuity and web search."""
    flow, suggestions = detect_metro_flow(request.message)
    session_service = get_session_service()

    raw_sid = request.get_session_id()
    if raw_sid:
        session = await session_service.get_session(
            app_name=APP_NAME,
            user_id=TEXT_API_USER_ID,
            session_id=raw_sid,
        )
        if session is None:
            resolved_sid = resolve_session_id(raw_sid)
            if resolved_sid != raw_sid:
                session = await session_service.get_session(
                    app_name=APP_NAME,
                    user_id=TEXT_API_USER_ID,
                    session_id=resolved_sid,
                )
            if session is None:
                if raw_sid == "unknown":
                    raise HTTPException(status_code=404, detail="Session not found")
                session = await session_service.create_session(
                    app_name=APP_NAME,
                    user_id=TEXT_API_USER_ID,
                    session_id=raw_sid,
                )
    else:
        session = await session_service.create_session(
            app_name=APP_NAME,
            user_id=TEXT_API_USER_ID,
        )

    session_id = session.id
    set_active_session_id(session_id)

    from app.agent.instructions import AGENT_INSTRUCTIONS

    text_instructions = (
        AGENT_INSTRUCTIONS
        + "\n\n## Text Formatting Guidelines:\n"
        + "- Always structure your reply with clear paragraphs separated by blank lines.\n"
        + "- When providing routes, travel steps, or station guidance, use numbered points (e.g., '1. **Boarding Station:** ...') or bullet items, each separated by blank lines.\n"
        + "- Bold important station names, metro line colors, fares, and journey times.\n"
        + "- Keep explanations concise, pleasant, and easy to read on mobile and desktop screens."
    )

    agent = create_agent(model=GEMINI_TEXT_MODEL)
    if hasattr(agent, "instruction"):
        agent.instruction = text_instructions

    runner = Runner(
        agent=agent,
        app_name=APP_NAME,
        session_service=session_service,
    )

    content = genai_types.Content(
        role="user",
        parts=[genai_types.Part.from_text(text=request.message)],
    )

    async def event_generator():
        full_text = ""
        MAX_RETRIES = 2
        for attempt in range(MAX_RETRIES):
            try:
                logger.info("stream_chat ADK runner attempt=%d session=%s", attempt + 1, session_id)
                streamed_any = False
                async for event in runner.run_async(
                    user_id=TEXT_API_USER_ID,
                    session_id=session_id,
                    new_message=content,
                ):
                    # Check for tool call indications
                    if hasattr(event, "get_function_calls") and callable(event.get_function_calls):
                        fcs = event.get_function_calls()
                        if fcs:
                            for fc in fcs:
                                tool_name = getattr(fc, "name", "tool")
                                if tool_name == "web_search":
                                    yield f"data: {json.dumps({'type': 'status', 'text': 'Checking real-time metro information…'})}\n\n"
                                elif tool_name == "search_dmrc_knowledge":
                                    yield f"data: {json.dumps({'type': 'status', 'text': 'Searching Delhi Metro knowledge…'})}\n\n"

                    # Check for text chunks
                    if hasattr(event, "content") and event.content and hasattr(event.content, "parts"):
                        for part in event.content.parts:
                            txt = getattr(part, "text", None)
                            if txt:
                                full_text += txt
                                streamed_any = True
                                yield f"data: {json.dumps({'type': 'token', 'text': txt})}\n\n"

                if streamed_any or full_text.strip():
                    break
            except Exception as err:
                err_str = str(err)
                if "503" in err_str or "UNAVAILABLE" in err_str:
                    if attempt < MAX_RETRIES - 1:
                        logger.warning("503 stream attempt %d — retrying in 2s", attempt + 1)
                        full_text = ""
                        yield f"data: {json.dumps({'type': 'status', 'text': 'High demand, retrying…'})}\n\n"
                        await asyncio.sleep(2)
                    else:
                        logger.warning("503 stream exhausted")
                else:
                    logger.error("Non-retryable stream error from ADK runner: %s", err_str, exc_info=True)
                    break

        if not full_text.strip():
            fallback_msg = "Delhi Metro assistance is temporarily unavailable. Please try again or call helpline 155370."
            full_text = fallback_msg
            yield f"data: {json.dumps({'type': 'token', 'text': fallback_msg})}\n\n"

        done_payload = {
            "type": "done",
            "reply": full_text.strip(),
            "flow": flow,
            "suggestions": suggestions,
            "session_id": session_id,
        }
        yield f"data: {json.dumps(done_payload)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/chat/reset")
async def reset_chat_session(req: ResetSessionRequest | None = None):
    """Clear session state and history for the given session_id."""
    raw_sid = req.session_id if req else None
    session_service = get_session_service()

    target_ids = []
    if raw_sid:
        target_ids.append(raw_sid)
    active_sid = get_active_session_id()
    if active_sid and active_sid not in target_ids:
        target_ids.append(active_sid)

    for sid in target_ids:
        try:
            await session_service.delete_session(
                app_name=APP_NAME,
                user_id=TEXT_API_USER_ID,
                session_id=sid,
            )
            logger.info("Session %s reset/deleted successfully.", sid)
        except Exception as err:
            logger.warning("Could not delete session %s: %s", sid, err)

    reset_active_session(raw_sid)
    return {"status": "ok", "message": "Session reset successfully"}


@app.websocket("/ws/audio")
async def websocket_audio_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for bidirectional audio streaming with Gemini Live.
    
    Receives audio chunks from the browser microphone, feeds them to the
    ADK agent via run_live, and sends back audio responses.
    """
    await websocket.accept()
    logger.info("WebSocket connection accepted.")

    raw_sid = websocket.query_params.get("session_id")
    session_id = resolve_session_id(raw_sid)
    user_id = TEXT_API_USER_ID

    try:
        # Create agent and runner
        agent = create_agent(model=GEMINI_LIVE_MODEL)
        session_service = get_session_service()

        session = await session_service.get_session(
            app_name=APP_NAME,
            user_id=user_id,
            session_id=session_id,
        )
        if session is None:
            session = await session_service.create_session(
                app_name=APP_NAME,
                user_id=user_id,
                session_id=session_id,
            )
        session_id = session.id
        set_active_session_id(session_id)
        logger.info("WebSocket connected using session: %s", session_id)

        runner = Runner(
            agent=agent,
            app_name=APP_NAME,
            session_service=session_service,
        )

        # Create a LiveRequestQueue for feeding audio to the agent
        live_request_queue = LiveRequestQueue()

        # Configure the live run with Aoede voice and live audio transcription
        run_config = RunConfig(
            response_modalities=[genai_types.Modality.AUDIO],
            speech_config=genai_types.SpeechConfig(
                voice_config=genai_types.VoiceConfig(
                    prebuilt_voice_config=genai_types.PrebuiltVoiceConfig(voice_name="Aoede")
                )
            ),
            output_audio_transcription=genai_types.AudioTranscriptionConfig(),
            input_audio_transcription=genai_types.AudioTranscriptionConfig(),
        )

        # Start the live agent loop in background
        live_events_task = asyncio.create_task(
            _process_live_events(runner, session, live_request_queue, run_config, websocket)
        )

        # Receive audio and messages from client and feed to live request queue
        try:
            while True:
                raw_message = await websocket.receive_text()
                msg = json.loads(raw_message)

                if msg.get("type") == "init":
                    lang = msg.get("lang", "en")
                    if lang == "hi":
                        greeting_prompt = "नमस्ते! आप दिल्ली मेट्रो की चेतना हैं। यात्री का संक्षेप में 1-2 वाक्यों में स्वागत करें और पूछें कि आप दिल्ली मेट्रो यात्रा, रूट या किराए में क्या मदद कर सकती हैं।"
                    else:
                        greeting_prompt = "Greet the commuter warmly as Chetna from Delhi Metro in 1-2 friendly sentences and ask how you can help them today with metro routes, fares, smart cards, or stations."
                    live_request_queue.send_content(
                        genai_types.Content(
                            role="user",
                            parts=[genai_types.Part.from_text(text=greeting_prompt)],
                        )
                    )

                elif msg.get("type") == "audio":
                    audio_bytes = base64.b64decode(msg["data"])
                    live_request_queue.send_realtime(
                        genai_types.Blob(
                            mime_type=msg.get("mime_type", "audio/pcm;rate=16000"),
                            data=audio_bytes,
                        )
                    )

                elif msg.get("type") == "text":
                    text_input = msg.get("text", "").strip()
                    if text_input:
                        live_request_queue.send_content(
                            genai_types.Content(
                                role="user",
                                parts=[genai_types.Part.from_text(text=text_input)],
                            )
                        )

                elif msg.get("type") == "stop":
                    logger.info("Client requested stop.")
                    live_request_queue.send_audio_stream_end()
                    break

        except WebSocketDisconnect:
            logger.info("WebSocket disconnected by client.")

        finally:
            # Signal the live request queue to close
            live_request_queue.close()
            # Wait for live events task to finish
            if not live_events_task.done():
                live_events_task.cancel()
                try:
                    await live_events_task
                except asyncio.CancelledError:
                    pass

    except Exception as e:
        logger.error("WebSocket error: %s", e, exc_info=True)
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass

    finally:
        logger.info("WebSocket session %s ended.", session_id)


try:
    from langsmith import traceable
except ImportError:
    def traceable(*args, **kwargs):
        def decorator(f):
            return f
        return decorator


@traceable(name="gemini_live_session", run_type="chain")
async def _process_live_events(runner, session, live_request_queue, run_config, websocket):
    """Process live events from the ADK runner and send responses to the client."""
    try:
        async for event in runner.run_live(
            session=session,
            live_request_queue=live_request_queue,
            run_config=run_config,
        ):
            # 1. Handle ADK Event content (audio and text)
            if hasattr(event, "content") and event.content and hasattr(event.content, "parts"):
                for part in event.content.parts:
                    # Audio data from model
                    if hasattr(part, "inline_data") and part.inline_data:
                        audio_b64 = base64.b64encode(
                            part.inline_data.data
                        ).decode("utf-8")
                        await websocket.send_json({
                            "type": "audio",
                            "data": audio_b64,
                        })

                    # Text transcript from model
                    if hasattr(part, "text") and part.text:
                        await websocket.send_json({
                            "type": "transcript_agent",
                            "text": part.text,
                        })

            # 2. Handle live model output transcription
            if hasattr(event, "output_transcription") and event.output_transcription:
                text = getattr(event.output_transcription, "text", None)
                finished = getattr(event.output_transcription, "finished", False)
                if text:
                    msg_type = "transcript_agent_final" if finished else "transcript_agent"
                    await websocket.send_json({
                        "type": msg_type,
                        "text": text,
                    })

            # 3. Handle user input transcription
            if hasattr(event, "input_transcription") and event.input_transcription:
                text = getattr(event.input_transcription, "text", None)
                finished = getattr(event.input_transcription, "finished", False)
                if text:
                    await websocket.send_json({
                        "type": "transcript_user",
                        "text": text,
                        "finished": finished,
                    })

            # 4. Handle tool calls
            if hasattr(event, "get_function_calls") and callable(event.get_function_calls):
                for fc in event.get_function_calls():
                    await websocket.send_json({
                        "type": "tool_call",
                        "tool": getattr(fc, "name", "unknown"),
                    })

    except asyncio.CancelledError:
        logger.info("Live events processing cancelled.")
    except Exception as e:
        logger.error("Error in live events processing: %s", e, exc_info=True)
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass


def run_server():
    """Run the FastAPI server."""
    import uvicorn

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    logger.info("Starting server on %s:%d", SERVER_HOST, SERVER_PORT)
    uvicorn.run(
        "app.main:app",
        host=SERVER_HOST,
        port=SERVER_PORT,
        reload=False,
    )


if __name__ == "__main__":
    run_server()
