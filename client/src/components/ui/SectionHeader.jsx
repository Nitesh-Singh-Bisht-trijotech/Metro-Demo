export default function SectionHeader({ icon, title, subtitle, action }) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        {icon && <span className="mt-0.5 text-dmrc-red">{icon}</span>}
        <div>
          <h2 className="text-lg font-medium text-dmrc-ink">{title}</h2>
          {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
        </div>
      </div>
      {action}
    </header>
  );
}
