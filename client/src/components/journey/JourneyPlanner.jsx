import { useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import SectionHeader from "../ui/SectionHeader";
import StationSelect from "../ui/StationSelect";
import FilterOption from "./FilterOption";
import { MetroBadge } from "../ui/Icons";
import { ROUTE_FILTERS, STATIONS } from "../../data/content";

const INITIAL = { from: "", to: "", filter: "shortest" };

export default function JourneyPlanner({ onSubmit }) {
  const [form, setForm] = useState(INITIAL);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Card tone="sky" className="p-4">
      <SectionHeader icon={<MetroBadge />} title="Plan Your Journey" />
      <p className="mt-3 text-sm text-dmrc-ink">
        Click here to plan through{" "}
        <a href="#map" className="text-blue-700 hover:underline">
          Interactive Map
        </a>
      </p>

      <form
        className="mt-3 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.(form);
        }}
      >
        <StationSelect label="From" value={form.from} onChange={set("from")} options={STATIONS} />
        <StationSelect label="To" value={form.to} onChange={set("to")} options={STATIONS} />

        <div>
          <span className="mb-1 block text-sm text-dmrc-red">Leaving</span>
          <div className="flex items-center gap-5">
            <Button variant="outline" type="button" className="!px-5 !py-1.5">Now</Button>
            <button type="button" className="text-sm text-blue-700 underline">Change Time</button>
          </div>
        </div>

        <fieldset>
          <legend className="mb-1 text-[17px] font-medium text-dmrc-ink">Advanced Filter</legend>
          <div role="radiogroup">
            {ROUTE_FILTERS.map((f) => (
              <FilterOption key={f.id} {...f} selected={form.filter === f.id} onSelect={set("filter")} />
            ))}
          </div>
        </fieldset>

        <div className="flex items-end justify-between pt-1">
          <button type="button" onClick={() => setForm(INITIAL)} className="text-sm font-medium text-blue-800 underline">
            Reset
          </button>
          <Button type="submit" className="!px-8">Show Route &amp; Fare</Button>
        </div>
      </form>
    </Card>
  );
}
