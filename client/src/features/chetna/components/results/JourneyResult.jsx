import { ResultCard, Stat, ChipButton, LineDot } from "./shared";
import { useChetnaContext } from "../../context/ChetnaContext";

export default function JourneyResult({ data }) {
  const { startFlow } = useChetnaContext();
  const prefill = { from: data.from, to: data.to };
  return (
    <ResultCard
      title={`${data.from} → ${data.to}`}
      subtitle={data.filter === "interchange" ? "Minimum interchange" : "Shortest route"}
      footer={
        <>
          <ChipButton onClick={() => startFlow("ticket", { prefill })}>Book ticket</ChipButton>
          <ChipButton onClick={() => startFlow("fare", { prefill })}>Fare details</ChipButton>
        </>
      }
    >
      <div className="mb-3 flex divide-x divide-gray-200">
        <Stat label="Time" value={`${data.durationMin} min`} />
        <Stat label="Stops" value={data.stops} />
        <Stat label="Fare" value={`₹${data.fare}`} />
      </div>

      <ol className="space-y-2">
        {data.legs.map((leg, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <LineDot color={leg.line.color} />
            <div>
              <p className="font-medium text-dmrc-ink">{leg.line.name}</p>
              <p className="text-xs text-gray-600">
                {leg.from} → {leg.to} · {leg.stops} stops
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-gray-500">
        {data.interchanges === 0 ? "Direct, no interchange." : `${data.interchanges} interchange at ${data.legs[0].to}.`}
      </p>
    </ResultCard>
  );
}