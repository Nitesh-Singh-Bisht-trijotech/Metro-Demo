import { ResultCard } from "./shared";
import FakeQr from "./FakeQr";

export default function TicketResult({ data }) {
  return (
    <ResultCard title="Ticket booked" subtitle={`Booking ID ${data.bookingId}`}>
      <div className="flex items-center gap-3">
        <FakeQr value={data.bookingId} />
        <dl className="space-y-1 text-xs">
          <div><dt className="text-gray-500">Journey</dt><dd className="font-medium text-dmrc-ink">{data.from} → {data.to}</dd></div>
          <div><dt className="text-gray-500">Passengers</dt><dd>{data.passengers}</dd></div>
          <div><dt className="text-gray-500">Total paid</dt><dd className="font-semibold text-emerald-700">₹{data.total}</dd></div>
          <div><dt className="text-gray-500">Valid until</dt><dd>{data.validUntil}</dd></div>
        </dl>
      </div>
      <p className="mt-2 text-[11px] text-gray-500">Demo ticket. The QR is decorative and cannot be scanned.</p>
    </ResultCard>
  );
}