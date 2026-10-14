import { Mic, MicOff, Send } from "lucide-react";
import { useState } from "react";
import { useSpeechInput } from "../hooks/useSpeechInput";
import { LANGS } from "../config/content";
import { useChetnaContext } from "../context/ChetnaContext";

export default function ChatInput() {
  const { lang, setLang, sendQuery, busy, t } = useChetnaContext();
  const [text, setText] = useState("");
  const { supported, listening, toggle } = useSpeechInput({ lang: LANGS[lang].speech, onText: setText });

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendQuery(text);
    setText("");
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2 border-t border-gray-100 bg-white px-3 py-2">
      <button
        type="button"
        onClick={() => setLang(lang === "en" ? "hi" : "en")}
        aria-label="Switch language"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800"
      >
        {LANGS[lang].label}
      </button>

      <div className="flex flex-1 items-center rounded-full border border-gray-300 px-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={listening ? "Listening…" : t.placeholder}
          aria-label="Message"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-dmrc-ink placeholder:text-gray-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={toggle}
          disabled={!supported}
          aria-label={listening ? "Stop listening" : "Use microphone"}
          title={supported ? "Speak" : "Voice input isn't supported in this browser"}
          className={`rounded-full p-1 disabled:opacity-40 ${listening ? "text-dmrc-red" : "text-blue-700"}`}
        >
          {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
      </div>

      {text.trim() && (
        <button type="submit" disabled={busy} aria-label="Send" className="rounded-full bg-[#2f5db0] p-2 text-white disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}