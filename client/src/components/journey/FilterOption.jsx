import { MapPinned, Repeat } from "lucide-react";

const ICONS = { route: MapPinned, swap: Repeat };

export default function FilterOption({ id, label, icon, selected, onSelect }) {
  const Icon = ICONS[icon];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(id)}
      className="flex w-full items-center gap-4 border-b border-sky-200 py-2 text-left last:border-0"
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded border border-dmrc-red ${
          selected ? "bg-dmrc-red text-white" : "bg-white text-dmrc-red"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-[15px] font-medium text-dmrc-ink">{label}</span>
    </button>
  );
}
