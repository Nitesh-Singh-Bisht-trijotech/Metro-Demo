import { ResultCard, LineDot } from "./shared";

const BADGE = {
  normal: "bg-emerald-100 text-emerald-800",
  delayed: "bg-amber-100 text-amber-800",
};

export default function StatusResult({ data }) {
  return (
    <ResultCard title="Live service status" subtitle={`Updated at ${data.updatedAt}`}>
      <ul className="divide-y divide-gray-100">
        {data.lines.map((l) => (
          <li key={l.name} className="py-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2"><LineDot color={l.color} />{l.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BADGE[l.status]}`}>
                {l.status === "normal" ? "Normal" : "Delayed"}
              </span>
            </div>
            {l.status !== "normal" && <p className="mt-1 pl-5 text-xs text-gray-600">{l.note}</p>}
          </li>
        ))}
      </ul>
    </ResultCard>
  );
}