import { MessageSquareText, Phone, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import ChetnaAvatar from "./ChetnaAvatar";
import { useChetnaContext } from "../context/ChetnaContext";

export default function ChetnaHeader() {
  const { setOpen, refreshSession, toggleChat, startCall, view, t } = useChetnaContext();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshSession();
    setTimeout(() => setIsRefreshing(false), 500);
  };

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
        <button
          type="button"
          onClick={startCall}
          aria-label={t.talk}
          title={t.talk}
          className="rounded-full bg-emerald-500 p-2 hover:bg-emerald-600 transition-colors"
        >
          <Phone className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={toggleChat}
          aria-label={view === "chat" ? t.back : t.chat}
          title={view === "chat" ? t.back : t.chat}
          className={`rounded p-1 hover:bg-white/15 transition-colors ${view === "chat" ? "bg-white/20" : ""}`}
        >
          <MessageSquareText className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleRefresh}
          aria-label={t.refresh}
          title={t.refresh}
          className="rounded p-1 hover:bg-white/15 transition-colors"
        >
          <RotateCcw
            className={`h-5 w-5 transition-transform duration-500 ${isRefreshing ? "-rotate-180" : ""}`}
          />
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t.close}
          title={t.close}
          className="rounded p-1 hover:bg-white/15 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}