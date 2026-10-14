import Card from "../ui/Card";
import { STATS, STATS_FOOTNOTE } from "../../data/content";

export default function StatsStrip() {
  return (
    <Card className="px-2 pb-2 pt-3">
      <dl className="grid grid-cols-3 divide-x divide-gray-200 text-center">
        {STATS.map(({ value, label, flagged }) => (
          <div key={label} className="flex flex-col-reverse px-2">
            <dt className="text-sm text-dmrc-ink">
              {label}
              {flagged && <sup className="text-dmrc-red">*</sup>}
            </dt>
            <dd className="text-3xl font-semibold text-emerald-700">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 px-2 text-[11px] text-dmrc-ink">
        <span className="text-dmrc-red">*</span>
        {STATS_FOOTNOTE}
      </p>
    </Card>
  );
}
