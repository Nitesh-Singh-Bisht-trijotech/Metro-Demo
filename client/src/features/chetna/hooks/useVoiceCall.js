import { useEffect, useRef, useState } from "react";
import { CALL_TEXT } from "../config/content";

/**
 * Real-time Voice Call hook powered by Google Live Gemini model over WebSocket.
 *
 * 1. Streams microphone PCM 16kHz audio to /ws/audio
 * 2. Receives and plays raw 24kHz audio from Gemini Live
 * 3. Displays live real-time transcripts from both user & agent
 */
export function useVoiceCall({ lang = "en", onTurn }) {
  const [status, setStatus] = useState("connecting");
  const [connected, setConnected] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [caption, setCaption] = useState("");
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [error, setError] = useState("");

  const wsRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const playbackContextRef = useRef(null);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef([]);

  const mutedRef = useRef(false);
  const speakerRef = useRef(true);
  const aliveRef = useRef(true);
  const agentTranscriptRef = useRef("");

  // Ensure AudioContext is ready for playback
  const ensurePlaybackContext = async () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!playbackContextRef.current || playbackContextRef.current.state === "closed") {
        playbackContextRef.current = new AudioCtx({ sampleRate: 24000 });
      }
      if (playbackContextRef.current.state === "suspended") {
        await playbackContextRef.current.resume();
      }
      return playbackContextRef.current;
    } catch (err) {
      console.warn("Failed to initialize playback context:", err);
      return null;
    }
  };

  // Play incoming 24kHz raw PCM audio from Gemini Live
  const playAudio = async (base64Data) => {
    if (!speakerRef.current || !aliveRef.current) return;

    try {
      const ctx = await ensurePlaybackContext();
      if (!ctx) return;

      const binaryStr = atob(base64Data);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      if (nextStartTimeRef.current < now) {
        nextStartTimeRef.current = now;
      }
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += buffer.duration;

      activeSourcesRef.current.push(source);
      setStatus("speaking");

      source.onended = () => {
        const idx = activeSourcesRef.current.indexOf(source);
        if (idx !== -1) {
          activeSourcesRef.current.splice(idx, 1);
        }
        if (activeSourcesRef.current.length === 0 && aliveRef.current) {
          if (!mutedRef.current) {
            setStatus("listening");
          }
        }
      };
    } catch (err) {
      console.warn("Audio playback error:", err);
    }
  };

  const stopAllAudio = () => {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
      } catch {
        /* ignore */
      }
    }
    activeSourcesRef.current = [];
    if (playbackContextRef.current) {
      nextStartTimeRef.current = playbackContextRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
  };

  const cleanup = () => {
    aliveRef.current = false;
    stopAllAudio();

    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch { /* ignore */ }
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch { /* ignore */ }
      audioContextRef.current = null;
    }

    if (playbackContextRef.current) {
      try { playbackContextRef.current.close(); } catch { /* ignore */ }
      playbackContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "stop" }));
        }
        wsRef.current.close();
      } catch {
        /* ignore */
      }
      wsRef.current = null;
    }
  };

  // Call timer
  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [connected]);

  // Unlock AudioContext on any user gesture during the call
  useEffect(() => {
    const unlock = () => {
      if (playbackContextRef.current && playbackContextRef.current.state === "suspended") {
        playbackContextRef.current.resume();
      }
    };
    window.addEventListener("click", unlock);
    window.addEventListener("touchstart", unlock);
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

  // Connect to Gemini Live audio WebSocket
  useEffect(() => {
    let isCancelled = false;
    aliveRef.current = true;
    agentTranscriptRef.current = "";

    async function initLiveCall() {
      try {
        setStatus("connecting");
        setCaption("Connecting to Chetna Voice Live…");

        // Unlock playback context during mount gesture
        await ensurePlaybackContext();

        // Request microphone at 16kHz
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        if (isCancelled || !aliveRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        mediaStreamRef.current = stream;

        // Setup AudioContext for recording mic
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx({ sampleRate: 16000 });
        audioContextRef.current = audioCtx;
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }

        const source = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        // Mute gain node so user doesn't hear own echo
        const muteNode = audioCtx.createGain();
        muteNode.gain.value = 0;

        // Build WebSocket URL: connect directly to backend or via proxy
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsHost = window.location.hostname === "localhost" ? "localhost:8000" : window.location.host;
        const wsUrl = `${protocol}//${wsHost}/ws/audio`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isCancelled || !aliveRef.current) {
            ws.close();
            return;
          }
          setConnected(true);
          setStatus("speaking");
          setCaption(CALL_TEXT[lang]?.greeting || "Connected to Chetna Live — speak now");

          // Trigger initial greeting in selected language
          ws.send(JSON.stringify({ type: "init", lang }));

          // Wire processor into audio graph
          source.connect(processor);
          processor.connect(muteNode);
          muteNode.connect(audioCtx.destination);

          // Stream mic audio chunks
          processor.onaudioprocess = (e) => {
            if (
              ws.readyState === WebSocket.OPEN &&
              aliveRef.current &&
              !mutedRef.current
            ) {
              const float32 = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(float32.length);
              for (let i = 0; i < float32.length; i++) {
                int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
              }
              const b64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
              ws.send(JSON.stringify({ type: "audio", data: b64 }));
            }
          };
        };

        ws.onmessage = (event) => {
          if (!aliveRef.current) return;
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === "audio") {
              // Raw audio from Gemini Live
              playAudio(msg.data);
            } else if (msg.type === "transcript_agent") {
              agentTranscriptRef.current += msg.text;
              setCaption(agentTranscriptRef.current);
            } else if (msg.type === "transcript_agent_final") {
              const text = msg.text || agentTranscriptRef.current;
              setCaption(text);
              onTurn?.("bot", text);
              agentTranscriptRef.current = "";
            } else if (msg.type === "transcript_user") {
              setCaption(msg.text);
              setStatus("thinking");
              if (msg.finished) {
                onTurn?.("user", msg.text);
              }
              agentTranscriptRef.current = "";
            } else if (msg.type === "tool_call") {
              setCaption(`Checking metro updates for ${msg.tool}…`);
              setStatus("thinking");
            } else if (msg.type === "error") {
              setError(msg.message);
              setStatus("error");
            }
          } catch (e) {
            console.warn("WS parse error:", e);
          }
        };

        ws.onclose = () => {
          if (!aliveRef.current) return;
          setConnected(false);
          setStatus("connecting");
        };

        ws.onerror = (err) => {
          console.warn("WebSocket error:", err);
          if (aliveRef.current) {
            setError("Connection problem with Gemini Live voice server.");
            setStatus("error");
          }
        };
      } catch (err) {
        if (!aliveRef.current) return;
        console.error("Voice call initialization failed:", err);
        setError("Microphone permission denied or audio device not available.");
        setStatus("error");
      }
    }

    initLiveCall();

    return () => {
      isCancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) {
      setStatus("muted");
    } else {
      setStatus("listening");
    }
  };

  const toggleSpeaker = () => {
    const next = !speakerRef.current;
    speakerRef.current = next;
    setSpeakerOn(next);
    if (!next) {
      stopAllAudio();
    }
  };

  // Typed question fallback through the Gemini Live session
  const sendText = (text) => {
    const q = text.trim();
    if (!q || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    setStatus("thinking");
    setCaption(q);
    onTurn?.("user", q);
    wsRef.current.send(JSON.stringify({ type: "text", text: q }));
  };

  const hasMediaDevices =
    typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

  return {
    status,
    connected,
    seconds,
    caption,
    muted,
    speakerOn,
    error,
    supported: hasMediaDevices,
    toggleMute,
    toggleSpeaker,
    sendText,
  };
}