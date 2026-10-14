import { FileText, MapPin } from "lucide-react";
import Card from "../ui/Card";
import SectionHeader from "../ui/SectionHeader";
import MetroMapPreview from "./MetroMapPreview";

export default function MetroMapCard() {
  return (
    <Card tone="blush" className="p-4" id="map">
      <SectionHeader
        icon={<MapPin className="h-6 w-6 text-pink-300" />}
        title="Interactive Metro Map"
        subtitle="Plan your journey using interactive and clickable map."
        action={
          <a href="#" aria-label="Download PDF map" className="text-pink-400 hover:text-dmrc-red">
            <FileText className="h-7 w-7" />
          </a>
        }
      />
      <div className="mt-3 h-40 overflow-hidden rounded border border-pink-100">
        <MetroMapPreview />
      </div>
    </Card>
  );
}
