import { ResultCard, Stat, ChipButton } from "./shared";
import { useChetnaContext } from "../../context/ChetnaContext";

export default function FareResult({ data }) {
  const { startFlow } = useChetnaContext();
  const prefill = { from: data.from, to: data.to };
  return (
    <ResultCard
      title={`${data.from} → ${data.to}`}
      subtitle={`${data.distanceKm} km`}
      footer={
        <>
          <ChipButton onClick={() => startFlow("journey", { prefill })}>Plan this journey</ChipButton>
          <ChipButton onClick={() => startFlow("ticket", { prefill })}>Book ticket</ChipButton>
        </>
      }
    >
      <div className="flex divide-x divide-gray-200">
        <Stat label="Token" value={`₹${data.token}`} />
        <Stat label="Smart card" value={`₹${data.smartCard}`} />
        <Stat label="Off-peak card" value={`₹${data.offPeakCard}`} />
      </div>
    </ResultCard>
  );
}