import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";

function RoundButton({ label, onClick, active, danger, children }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        aria-label={label}
        aria-pressed={active}
        className={`flex items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
          danger
            ? "h-16 w-16 bg-red-600 hover:bg-red-700"
            : `h-14 w-14 ${active ? "bg-white text-indigo-900" : "bg-white/15 hover:bg-white/25"}`
        }`}
      >
        {children}
      </button>
      <span className="text-xs text-white/80">{label}</span>
    </div>
  );
}

export default function CallControls({ muted, speakerOn, onMute, onSpeaker, onEnd }) {
  return (
    <div className="flex items-end justify-center gap-8">
      <RoundButton label={muted ? "Unmute" : "Mute"} onClick={onMute} active={muted}>
        {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
      </RoundButton>
      <RoundButton label="End call" onClick={onEnd} danger>
        <PhoneOff className="h-7 w-7" />
      </RoundButton>
      <RoundButton label={speakerOn ? "Speaker" : "Speaker off"} onClick={onSpeaker} active={!speakerOn}>
        {speakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
      </RoundButton>
    </div>
  );
}