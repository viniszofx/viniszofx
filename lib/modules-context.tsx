"use client";
import { createContext, useContext, type ReactNode } from "react";

const ModulesContext = createContext<string[]>([]);

/** Módulos desligados, disponíveis para os componentes do painel. */
export function ModulesProvider({ disabled, children }: { disabled: string[]; children: ReactNode }) {
  return <ModulesContext.Provider value={disabled}>{children}</ModulesContext.Provider>;
}
export function useModuleEnabled() {
  const disabled = useContext(ModulesContext);
  return (key: string) => !disabled.includes(key);
}
