import { ResultCard, ChipButton, LineDot } from "./shared";
import { useChetnaContext } from "../../context/ChetnaContext";

export default function StationResult({ data }) {
  const { startFlow } = useChetnaContext();
  return (
    <ResultCard
      title={data.name}
      subtitle={data.interchange ? "Interchange station" : "Station"}
      footer={<ChipButton onClick={() => startFlow("journey", { prefill: { from: data.name } })}>Plan from here</ChipButton>}
    >
      <ul className="mb-3 space-y-1">
        {data.lines.map((l) => (
          <li key={l.name} className="flex items-center gap-2 text-sm">
            <LineDot color={l.color} /> {l.name}
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-2 gap-y-1 text-xs">
        <dt className="text-gray-500">First train</dt><dd>{data.firstTrain}</dd>
        <dt className="text-gray-500">Last train</dt><dd>{data.lastTrain}</dd>
        <dt className="text-gray-500">Gates</dt><dd>{data.gates}</dd>
        <dt className="text-gray-500">Platforms</dt><dd>{data.platforms}</dd>
      </dl>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {data.facilities.map((f) => (
          <li key={f} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800">{f}</li>
        ))}
      </ul>
    </ResultCard>
  );
}