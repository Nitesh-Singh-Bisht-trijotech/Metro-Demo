import { MessageSquareText, Phone, X } from "lucide-react";
import ChetnaAvatar from "./ChetnaAvatar";
import { useChetnaContext } from "../context/ChetnaContext";

export default function ChetnaHeader() {
  const { setOpen, reset, startCall, t } = useChetnaContext();
  return (
    <header className="flex items-center justify-between bg-[#2f5db0] px-4 py-2.5 text-white">
      <div className="flex items-center gap-3">
        <ChetnaAvatar className="h-10 w-10 ring-2 ring-white" />
        <div className="leading-tight">
          <p className="text-xs">Ask</p>
          <h2 className="text-sm font-bold tracking-wide">CHETNA</h2>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={startCall} aria-label={t.talk} title={t.talk} className="rounded-full bg-emerald-500 p-2 hover:bg-emerald-600">
          <Phone className="h-4 w-4" />
        </button>
        <button onClick={reset} aria-label={t.back} title={t.back} className="rounded p-1 hover:bg-white/15">
          <MessageSquareText className="h-5 w-5" />
        </button>
        <button onClick={() => setOpen(false)} aria-label={t.close} title={t.close} className="rounded p-1 hover:bg-white/15">
          <X className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}