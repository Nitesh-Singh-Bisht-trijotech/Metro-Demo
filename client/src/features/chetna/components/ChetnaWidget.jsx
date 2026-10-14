import { ChetnaProvider, useChetnaContext } from "../context/ChetnaContext";
import ChetnaLauncher from "./ChetnaLauncher";
import ChetnaPanel from "./ChetnaPanel";

function Shell() {
  const { open } = useChetnaContext();
  return open ? <ChetnaPanel /> : <ChetnaLauncher />;
}

export default function ChetnaWidget() {
  return (
    <ChetnaProvider>
      <Shell />
    </ChetnaProvider>
  );
}