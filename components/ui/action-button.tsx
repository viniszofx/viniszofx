"use client";
import type { ComponentType } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export type Action = { key: string; label: string; icon: ComponentType<{ className?: string }>; run: () => void; destructive?: boolean };

/** Icon button whose label shows on wide screens (or always, inside menus). */
export function ActionButton({ action, showLabel = false }: { action: Action; showLabel?: boolean }) {
  const { icon: Icon, label, run, destructive } = action;
  return <Button type="button" variant="ghost" size={showLabel ? "sm" : "icon-sm"} title={label} aria-label={label} onClick={run}
    className={cn(showLabel && "w-full justify-start", destructive && "text-destructive hover:text-destructive")}>
    <Icon className="size-4" /><span className={showLabel ? undefined : "hidden xl:inline"}>{label}</span>
  </Button>;
}

export function ActionList({ actions, showLabel }: { actions: Action[]; showLabel?: boolean }) {
  return <>{actions.map(action => <ActionButton key={action.key} action={action} showLabel={showLabel} />)}</>;
}
