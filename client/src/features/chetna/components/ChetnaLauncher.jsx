import ChetnaAvatar from "./ChetnaAvatar";
import { useChetnaContext } from "../context/ChetnaContext";

export default function ChetnaLauncher() {
  const { setOpen } = useChetnaContext();
  return (
    <aside className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-1">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open chat with Chetna"
        className="rounded-full border-4 border-white shadow-lg ring-1 ring-gray-200 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-dmrc-red"
      >
        <ChetnaAvatar className="h-16 w-16" />
      </button>
      <p className="rounded bg-white px-3 py-1.5 text-sm shadow-card">
        Hi, I am <b className="text-blue-700">Chetna</b>, your{" "}
        <span className="text-blue-600">AI Assistant.</span>
      </p>
    </aside>
  );
}