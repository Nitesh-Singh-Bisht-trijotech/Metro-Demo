import { useState } from "react";
import { Send } from "lucide-react";
import ChetnaAvatar from "../ChetnaAvatar";
import CallControls from "./CallControls";
import VoiceBars from "./VoiceBars";
import { useVoiceCall } from "../../hooks/useVoiceCall";
import { formatTime } from "../../utils/speech";
import { useChetnaContext } from "../../context/ChetnaContext";

const LABEL = {
  connecting: "Calling…",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Chetna is speaking",
  muted: "You're on mute",
  text: "Type your question below",
  error: "Call problem",
};

const RING = {
  connecting: "bg-white/20",
  listening: "bg-sky-300/25",
  speaking: "bg-emerald-300/25",
};

export default function CallScreen() {
  const { lang, endCall, logTurn } = useChetnaContext();
  const call = useVoiceCall({ lang, onTurn: logTurn });
  const [typed, setTyped] = useState("");

  const pulsing = call.status in RING;

  return (
    <div
      role="region"
      aria-label="Voice call with Chetna"
      className="absolute inset-0 z-10 flex flex-col items-center justify-between bg-gradient-to-b from-[#1b2a5c] via-[#243a80] to-[#0f1a3d] px-6 pb-8 pt-10 text-white"
    >
      <div className="text-center">
        <h2 className="text-xl font-semibold">Chetna</h2>
        <p className="text-sm text-white/70">Delhi Metro assistant</p>
        <p className="mt-2 text-sm" aria-live="polite">
          {call.connected ? formatTime(call.seconds) : "Ringing…"}
        </p>
      </div>

      <div className="flex flex-col items-center gap-5">
        <div className="relative flex h-44 w-44 items-center justify-center">
          {pulsing && (
            <>
              <span className={`absolute inset-0 animate-ping rounded-full motion-reduce:animate-none ${RING[call.status]}`} />
              <span className="absolute -inset-4 animate-pulse rounded-full bg-white/5 motion-reduce:animate-none" />
            </>
          )}
          <ChetnaAvatar className="h-40 w-40 ring-4 ring-white/30" />
        </div>

        <p className="text-sm font-medium text-white/90">{LABEL[call.status]}</p>
        <VoiceBars active={call.status === "speaking" || call.status === "thinking"} />

        <p
          aria-live="polite"
          className="min-h-[4.5rem] max-w-xs text-center text-base leading-snug text-white/90"
        >
          {call.error || call.caption}
        </p>

        {call.connected && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!typed.trim()) return;
              call.sendText(typed);
              setTyped("");
            }}
            className="flex w-full max-w-xs items-center gap-2 rounded-full bg-white/15 px-3 py-1 ring-1 ring-white/20 focus-within:ring-white/50"
          >
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={call.supported ? "Speak or type your question…" : "Type your question…"}
              aria-label="Type your question"
              className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-white placeholder:text-white/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!typed.trim()}
              aria-label="Send"
              className="p-1 text-white/80 transition-colors hover:text-white disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>

      <CallControls
        muted={call.muted}
        speakerOn={call.speakerOn}
        onMute={call.toggleMute}
        onSpeaker={call.toggleSpeaker}
        onEnd={() => endCall(call.seconds)}
      />
    </div>
  );
}