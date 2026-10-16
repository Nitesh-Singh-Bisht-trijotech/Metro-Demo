import { BASE, http } from "./http";
import * as mock from "./mockApi";

// One conversation per browser tab for session memory
function threadId() {
  try {
    let id = sessionStorage.getItem("chetna_thread");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("chetna_thread", id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

// Helpers with graceful fallback to mock if the endpoint is not yet on the live backend
async function withFallback(liveFn, fallbackFn) {
  try {
    return await liveFn();
  } catch (err) {
    console.warn("Live API call failed, falling back to local data:", err);
    return await fallbackFn();
  }
}

export const fetchStations = () =>
  withFallback(() => http("/api/stations"), () => mock.fetchStations());

export const planJourney = (b) =>
  withFallback(() => http("/api/journey", { method: "POST", body: b }), () => mock.planJourney(b));

export const calculateFare = (b) =>
  withFallback(() => http("/api/fare", { method: "POST", body: b }), () => mock.calculateFare(b));

export const getStationDetails = (b) =>
  withFallback(
    () => http(`/api/stations/${encodeURIComponent(b.station)}`),
    () => mock.getStationDetails(b)
  );

export const getServiceStatus = () =>
  withFallback(() => http("/api/status"), () => mock.getServiceStatus());

export const bookTicket = (b) =>
  withFallback(() => http("/api/tickets", { method: "POST", body: b }), () => mock.bookTicket(b));

export const reportLostItem = (b) =>
  withFallback(() => http("/api/lost-found", { method: "POST", body: b }), () => mock.reportLostItem(b));

export const getHelpContacts = () =>
  withFallback(() => http("/api/help"), () => mock.getHelpContacts());

/**
 * Non-streaming chat turn.
 * Compatible with FastAPI backend ChatRequest(message, session_id).
 */
export async function askChetna(message, lang = "en", channel = "text") {
  const tid = threadId();
  try {
    const res = await http("/api/chat", {
      method: "POST",
      body: {
        message,
        session_id: tid,
        thread_id: tid,
        lang,
        channel,
      },
      timeout: 60000,
    });

    const reply = res.response || res.reply || "";
    return {
      reply,
      session_id: res.session_id || tid,
      flow: res.flow,
      prefill: res.prefill,
      suggestions: res.suggestions,
    };
  } catch (err) {
    console.warn("Backend chat failed, falling back to mock:", err);
    return await mock.askChetna(message, lang);
  }
}

/**
 * Streaming chat turn via SSE with fallback to standard chat.
 */
export async function askChetnaStream(message, { lang = "en", channel = "text", onToken, signal } = {}) {
  const tid = threadId();

  try {
    const res = await fetch(`${BASE}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        session_id: tid,
        thread_id: tid,
        lang,
        channel,
      }),
      signal,
    });

    if (res.ok && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let final = {};

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop();
        for (const evt of events) {
          const line = evt.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          try {
            const data = JSON.parse(line.slice(5).trim());
            if (data.type === "token") onToken?.(data.text);
            else if (data.type === "done") final = data;
          } catch {
            // ignore malformed SSE event
          }
        }
      }
      return {
        reply: final.reply,
        flow: final.flow,
        prefill: final.prefill,
        suggestions: final.suggestions,
      };
    }
  } catch (e) {
    if (e.name === "AbortError") throw e;
    // SSE not supported or endpoint returned error -> fall back to non-streaming
  }

  // Fallback to standard chat and emit full response as token
  const res = await askChetna(message, lang, channel);
  if (res.reply) onToken?.(res.reply);
  return res;
}

export function resetSession() {
  try {
    const oldId = sessionStorage.getItem("chetna_thread");
    const newId = crypto.randomUUID();
    sessionStorage.setItem("chetna_thread", newId);
    if (oldId) {
      http("/api/chat/reset", {
        method: "POST",
        body: { session_id: oldId },
      }).catch(() => {});
    }
    return newId;
  } catch {
    return "anonymous";
  }
}

