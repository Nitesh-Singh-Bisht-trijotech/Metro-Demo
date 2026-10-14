import { ChevronDown } from "lucide-react";
import { useId } from "react";

export default function StationSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Type station name or click to select",
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-dmrc-red">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          list={`${id}-list`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded border border-blue-300 bg-white px-2 py-2.5 pr-8 text-sm text-dmrc-ink placeholder:text-gray-500 focus:border-dmrc-red focus:outline-none"
        />
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700" />
        <datalist id={`${id}-list`}>
          {options.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
