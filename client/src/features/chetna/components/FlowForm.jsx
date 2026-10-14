import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import StationSelect from "../../../components/ui/StationSelect";
import Button from "../../../components/ui/Button";
import { FLOWS } from "../config/flows";
import { useChetnaContext } from "../context/ChetnaContext";

const inputCls =
  "w-full rounded border border-blue-300 bg-white px-2 py-2 text-sm text-dmrc-ink placeholder:text-gray-500 focus:border-dmrc-red focus:outline-none";

const initialValues = (flow, prefill) =>
  Object.fromEntries(flow.fields.map((f) => [f.name, prefill?.[f.name] ?? f.default ?? ""]));

function Field({ field, value, onChange, stations }) {
  const label = <span className="mb-1 block text-sm text-dmrc-red">{field.label}</span>;

  switch (field.type) {
    case "station":
      return <StationSelect label={field.label} value={value} onChange={onChange} options={stations} placeholder="Type or select a station" />;

    case "select":
      return (
        <label className="block">
          {label}
          <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      );

    case "number":
      return (
        <div>
          {label}
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Decrease" disabled={value <= field.min} onClick={() => onChange(value - 1)} className="rounded border border-gray-300 bg-white p-1.5 disabled:opacity-40">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center text-sm font-medium">{value}</span>
            <button type="button" aria-label="Increase" disabled={value >= field.max} onClick={() => onChange(value + 1)} className="rounded border border-gray-300 bg-white p-1.5 disabled:opacity-40">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      );

    default:
      return (
        <label className="block">
          {label}
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className={inputCls} />
        </label>
      );
  }
}

export default function FlowForm({ message }) {
  const { id, flowId, initial, submitted } = message;
  const flow = FLOWS[flowId];
  const { stations, submitFlow } = useChetnaContext();
  const [values, setValues] = useState(() => initialValues(flow, initial));
  const [error, setError] = useState("");

  const set = (name) => (v) => setValues((prev) => ({ ...prev, [name]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = { ...values };

    for (const f of flow.fields) {
      if (f.type === "number") continue;
      if (!String(next[f.name]).trim()) return setError(`${f.label} is required.`);
      if (f.type === "station") {
        const match = stations.find((s) => s.toLowerCase() === next[f.name].trim().toLowerCase());
        if (!match) return setError(`Couldn't find "${next[f.name]}". Pick a station from the list.`);
        next[f.name] = match;
      }
    }

    const problem = flow.validate?.(next);
    if (problem) return setError(problem);

    setError("");
    submitFlow(flowId, next, id);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full rounded-xl bg-sky-100 p-3 shadow-card">
      <fieldset disabled={submitted} className="space-y-3 disabled:opacity-60">
        {flow.fields.map((f) => (
          <Field key={f.name} field={f} value={values[f.name]} onChange={set(f.name)} stations={stations} />
        ))}
      </fieldset>
      {error && <p role="alert" className="mt-2 text-xs text-dmrc-red">{error}</p>}
      {!submitted && (
        <Button type="submit" className="mt-3 w-full">
          {flow.label === "Book your ticket online" ? "Book ticket" : "Submit"}
        </Button>
      )}
    </form>
  );
}