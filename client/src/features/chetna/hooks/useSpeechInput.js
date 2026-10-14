import { useCallback, useEffect, useRef, useState } from "react";

/** Thin wrapper over the browser Web Speech API (Chrome/Edge). */
export function useSpeechInput({ lang = "en-IN", onText }) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);

  const Ctor =
    typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supported = Boolean(Ctor);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.onresult = (e) => onText?.(Array.from(e.results).map((r) => r[0].transcript).join(" "));
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [Ctor, lang, onText]);

  const toggle = useCallback(() => (listening ? stop() : start()), [listening, start, stop]);

  useEffect(() => () => recRef.current?.abort(), []);

  return { supported, listening, toggle };
}