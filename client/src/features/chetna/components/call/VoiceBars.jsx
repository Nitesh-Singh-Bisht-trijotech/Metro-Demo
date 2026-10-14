const HEIGHTS = ["h-4", "h-8", "h-6", "h-10", "h-5"];

export default function VoiceBars({ active }) {
  return (
    <div className="flex h-10 items-center justify-center gap-1.5" aria-hidden="true">
      {HEIGHTS.map((h, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-full bg-white/80 ${active ? `${h} animate-pulse motion-reduce:animate-none` : "h-1.5"}`}
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}