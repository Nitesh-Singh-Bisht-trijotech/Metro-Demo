import { useCallback, useEffect, useState } from "react";
import { askChetnaStream, fetchStations, resetSession as apiResetSession } from "../api/chetnaApi";
import { FLOWS } from "../config/flows";
import { formatTime } from "../utils/speech";

let counter = 0;
const nextId = () => `m${++counter}`;

/**
 * All Chetna state + actions. UI components stay dumb and just call these.
 * Message shape: { id, role: 'bot'|'user', kind: 'text'|'form'|'result'|'typing', ... }
 */
export function useChetna() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [stations, setStations] = useState([]);
  const [calling, setCalling] = useState(false);
  const [view, setView] = useState("home");

  // load the station list once, the first time the panel opens
  useEffect(() => {
    if (open && stations.length === 0) {
      fetchStations().then(setStations).catch(() => {});
    }
  }, [open, stations.length]);

  // close the call if the panel closes
  useEffect(() => {
    if (!open) setCalling(false);
  }, [open]);

  const push = useCallback((msg) => {
    const id = nextId();
    setMessages((prev) => [...prev, { id, role: "bot", ...msg }]);
    return id;
  }, []);

  const patch = useCallback(
    (id, changes) => setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...changes } : m))),
    []
  );

  const drop = useCallback((id) => setMessages((prev) => prev.filter((m) => m.id !== id)), []);

  const withTyping = useCallback(
    async (task) => {
      const typingId = push({ kind: "typing" });
      setBusy(true);
      try {
        return await task();
      } finally {
        drop(typingId);
        setBusy(false);
      }
    },
    [push, drop]
  );

  const startCall = useCallback(() => setCalling(true), []);

  const endCall = useCallback(
    (sec = 0) => {
      setCalling(false);
      if (sec > 0) push({ kind: "text", system: true, text: `Call ended · ${formatTime(sec)}` });
    },
    [push]
  );

  const logTurn = useCallback(
    (role, text) => {
      setView("chat");
      return push({ role, kind: "text", text });
    },
    [push]
  );

  /** Run a flow's API call and append the result card. */
  const submitFlow = useCallback(
    async (flowId, values, formId) => {
      setView("chat");
      const flow = FLOWS[flowId];
      if (formId) patch(formId, { submitted: true });
      if (flow.fields.length) push({ role: "user", kind: "text", text: flow.summarize(values) });
      try {
        const data = await withTyping(() => flow.submit(values));
        push({ kind: "result", flowId, data });
      } catch {
        push({
          kind: "text",
          text: "Sorry, I couldn't fetch that right now.",
          retry: { flowId, values },
        });
      }
    },
    [patch, push, withTyping]
  );

  /** Begin a flow: echo the user's choice, then show the form (or run it straight away). */
  const startFlow = useCallback(
    (flowId, { echo = true, prefill = {} } = {}) => {
      setView("chat");
      const flow = FLOWS[flowId];
      if (echo) push({ role: "user", kind: "text", text: flow.label });
      push({ kind: "text", text: flow.intro });
      if (flow.fields.length === 0) return submitFlow(flowId, {});
      push({ kind: "form", flowId, initial: prefill });
    },
    [push, submitFlow]
  );

  const sendQuery = useCallback(
    async (text) => {
      const q = text.trim();
      if (!q || busy) return;
      setView("chat");
      push({ role: "user", kind: "text", text: q });

      const id = push({ kind: "text", text: "" }); // filled in as tokens arrive
      setBusy(true);
      try {
        const res = await askChetnaStream(q, {
          lang,
          onToken: (tok) =>
            setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text: m.text + tok } : m))),
        });
        if (res.suggestions) patch(id, { suggestions: res.suggestions });
        if (res.flow) startFlow(res.flow, { echo: false, prefill: res.prefill });
      } catch {
        patch(id, { text: "Something went wrong. Please try again." });
      } finally {
        setBusy(false);
      }
    },
    [busy, lang, push, patch, startFlow]
  );

  /** Toggle or open chat view */
  const toggleChat = useCallback(() => {
    if (calling) {
      setCalling(false);
      setView("chat");
      return;
    }
    if (view === "chat") {
      setView("home");
    } else {
      if (messages.length === 0) {
        const welcomeText =
          lang === "hi"
            ? "नमस्ते! मैं दिल्ली मेट्रो की चेतना हूँ। आज आपकी मेट्रो यात्रा में मैं क्या मदद कर सकती हूँ — रूट, किराया, स्मार्ट कार्ड या स्टेशन संबंधी जानकारी?"
            : "Namaste! I'm Chetna from Delhi Metro. How can I help you with your metro journey today, whether it's about routes, fares, smart cards, or stations?";
        push({ role: "bot", kind: "text", text: welcomeText });
      }
      setView("chat");
    }
  }, [calling, view, messages.length, lang, push]);

  /** Clears the chat history and refreshes the session */
  const refreshSession = useCallback(() => {
    setCalling(false);
    setBusy(false);
    setMessages([]);
    setView("home");
    apiResetSession();
  }, []);

  const reset = refreshSession;

  return {
    open, setOpen, lang, setLang, messages, busy, stations,
    calling, startCall, endCall, logTurn,
    view, setView, toggleChat,
    startFlow, submitFlow, sendQuery, reset, refreshSession,
  };
}