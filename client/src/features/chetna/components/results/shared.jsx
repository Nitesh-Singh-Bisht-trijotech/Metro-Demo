export function ResultCard({ title, subtitle, children, footer }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-blue-100 bg-white shadow-card">
      <div className="bg-blue-50 px-3 py-2">
        <h3 className="text-sm font-semibold text-dmrc-ink">{title}</h3>
        {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
      </div>
      <div className="p-3">{children}</div>
      {footer && <div className="flex flex-wrap gap-2 border-t border-gray-100 p-3">{footer}</div>}
    </div>
  );
}

export function Stat({ label, value }) {
  return (
    <div className="flex-1 text-center">
      <div className="text-lg font-semibold text-emerald-700">{value}</div>
      <div className="text-[11px] text-gray-600">{label}</div>
    </div>
  );
}

export function ChipButton({ children, ...props }) {
  return (
    <button
      className="rounded-full border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-50"
      {...props}
    >
      {children}
    </button>
  );
}

export function LineDot({ color }) {
  return <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />;
}