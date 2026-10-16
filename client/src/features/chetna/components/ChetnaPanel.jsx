import ChetnaHeader from "./ChetnaHeader";
import HomeView from "./HomeView";
import ChatView from "./ChatView";
import ChatInput from "./ChatInput";
import PanelFooter from "./PanelFooter";
import CallScreen from "./call/CallScreen";
import { useChetnaContext } from "../context/ChetnaContext";

export default function ChetnaPanel() {
  const { view, setOpen, calling } = useChetnaContext();
  return (
    <div
      role="dialog"
      aria-label="Chetna AI assistant"
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      className="chetna-pop fixed bottom-4 right-4 z-50 flex h-[min(760px,calc(100vh-2rem))] w-[min(520px,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-black/10"
    >
      <ChetnaHeader />
      <div className="flex-1 overflow-y-auto">
        {view === "home" ? <HomeView /> : <ChatView />}
      </div>
      <ChatInput />
      <PanelFooter />
      {calling && <CallScreen />}
    </div>
  );
}