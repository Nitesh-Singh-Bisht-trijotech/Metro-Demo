import { ChevronRight, Phone, Ticket } from "lucide-react";
import Carousel from "./Carousel";
import ActionTile from "./ActionTile";
import { QUICK_PROMPTS, SLIDES } from "../config/content";
import { FLOWS, TILE_ORDER } from "../config/flows";
import { useChetnaContext } from "../context/ChetnaContext";

export default function HomeView() {
  const { sendQuery, startCall, t } = useChetnaContext();
  return (
    <div>
      <Carousel slides={SLIDES} />
      <div className="space-y-4 p-4">
        <button
          onClick={() => sendQuery(QUICK_PROMPTS.ticket)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-200 py-3.5 text-sm font-medium text-blue-900 shadow-md hover:bg-blue-300"
        >
          <Ticket className="h-4 w-4" />
          {t.book}
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          onClick={startCall}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-medium text-white shadow-md hover:bg-emerald-700"
        >
          <Phone className="h-4 w-4" />
          {t.talk}
        </button>

        <div className="grid grid-cols-2 gap-4">
          {TILE_ORDER.map((id) => (
            <ActionTile
              key={id}
              label={FLOWS[id].label}
              {...FLOWS[id].tile}
              onClick={() => sendQuery(QUICK_PROMPTS[id])}
            />
          ))}
        </div>
      </div>
    </div>
  );
}