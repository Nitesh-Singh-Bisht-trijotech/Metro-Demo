import TopBar from "./components/layout/TopBar";
import Header from "./components/layout/Header";
import JourneyPlanner from "./components/journey/JourneyPlanner";
import StatsStrip from "./components/home/StatsStrip";
import MetroMapCard from "./components/home/MetroMapCard";
import KnowYourStation from "./components/home/KnowYourStation";
import CollapsibleCard from "./components/home/CollapsibleCard";
import PromoBanner from "./components/home/PromoBanner";
import NoticesAlerts from "./components/home/NoticesAlerts";
import { ChetnaWidget } from "./features/chetna";
import { COLLAPSIBLE_CARDS } from "./data/content";

export default function App() {
  const handleRoute = (form) => console.log("Route request:", form);

  return (
    <div className="min-h-screen bg-white font-sans text-dmrc-ink">
      <TopBar />
      <Header />

      <main className="mx-auto grid max-w-[1400px] gap-5 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)]">
        <div>
          <JourneyPlanner onSubmit={handleRoute} />
        </div>

        <div className="space-y-5">
          <StatsStrip />
          <MetroMapCard />
          <KnowYourStation />
          <div className="space-y-4 px-2">
            {COLLAPSIBLE_CARDS.map((c) => (
              <CollapsibleCard key={c.id} {...c} />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <PromoBanner />
          <NoticesAlerts />
        </div>
      </main>

      <ChetnaWidget />
    </div>
  );
}