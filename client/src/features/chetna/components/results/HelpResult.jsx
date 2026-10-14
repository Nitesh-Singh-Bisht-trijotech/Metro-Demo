import { Mail, Phone } from "lucide-react";
import { ResultCard } from "./shared";

export default function HelpResult({ data }) {
  return (
    <ResultCard title="Delhi Metro helpdesk" subtitle={data.hours}>
      <ul className="space-y-2 text-sm">
        <li>
          <a href={`tel:${data.helpline}`} className="flex items-center gap-2 text-blue-700 hover:underline">
            <Phone className="h-4 w-4" /> {data.helpline}
          </a>
        </li>
        <li>
          <a href={`mailto:${data.email}`} className="flex items-center gap-2 text-blue-700 hover:underline">
            <Mail className="h-4 w-4" /> {data.email}
          </a>
        </li>
      </ul>
    </ResultCard>
  );
}