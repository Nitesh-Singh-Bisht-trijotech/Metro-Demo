export default function HelplineBadge({ number = "155370" }) {
  return (
    <div className="w-28 overflow-hidden rounded border border-gray-200 text-center">
      <div className="flex items-center justify-center gap-1 bg-white px-1 py-0.5">
        <span className="text-2xl font-bold text-dmrc-red">24</span>
        <span className="text-[9px] font-semibold leading-tight text-dmrc-ink">
          Hour DMRC
          <br />
          Helpline nos.
        </span>
      </div>
      <div className="bg-emerald-500 py-0.5 text-sm font-semibold text-white">{number}</div>
    </div>
  );
}
