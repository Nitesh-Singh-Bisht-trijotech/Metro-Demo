export default function ActionTile({ label, icon: Icon, bg, fg, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between gap-2 rounded-xl px-4 py-5 text-left text-sm font-medium text-dmrc-ink shadow-md transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${bg}`}
    >
      <span className="max-w-[5.5rem]">{label}</span>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/60 ${fg}`}>
        <Icon className="h-5 w-5" />
      </span>
    </button>
  );
}