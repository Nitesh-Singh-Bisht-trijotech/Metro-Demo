import { ResultCard } from "./shared";

export default function AckResult({ data }) {
  return (
    <ResultCard title="Report filed" subtitle={`Reference ${data.reference}`}>
      <p className="text-sm text-dmrc-ink">
        We've logged your lost <b>{data.item}</b> at <b>{data.station}</b>. The station team will
        call you on {data.phone} if it is found.
      </p>
    </ResultCard>
  );
}