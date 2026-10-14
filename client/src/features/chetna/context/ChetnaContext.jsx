import { createContext, useContext } from "react";
import { useChetna } from "../hooks/useChetna";
import { STRINGS } from "../config/content";

const ChetnaContext = createContext(null);

export function ChetnaProvider({ children }) {
  const chetna = useChetna();
  const value = { ...chetna, t: STRINGS[chetna.lang] };
  return <ChetnaContext.Provider value={value}>{children}</ChetnaContext.Provider>;
}

export function useChetnaContext() {
  const ctx = useContext(ChetnaContext);
  if (!ctx) throw new Error("useChetnaContext must be used inside <ChetnaProvider>");
  return ctx;
}