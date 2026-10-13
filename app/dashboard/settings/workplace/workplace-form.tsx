"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { saveWorkplaceSettings, type WorkplaceActionState } from "./actions";

const initialState: WorkplaceActionState = { status: "idle", message: "" };
const fieldClass = "w-full border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar alterações"}</Button>;
}

export function WorkplaceForm({ name, description }: { name: string; description: string }) {
  const [state, formAction] = useActionState(saveWorkplaceSettings, initialState);
  return <form action={formAction} className="space-y-6">
    <div className="space-y-2">
      <label htmlFor="workplace-name" className="block text-sm font-medium">Nome do Workplace</label>
      <input id="workplace-name" name="name" defaultValue={name} minLength={2} maxLength={60} required className={fieldClass} />
      <p className="text-xs text-muted-foreground">Aparece na página inicial do Workspace.</p>
    </div>
    <div className="space-y-2">
      <label htmlFor="workplace-description" className="block text-sm font-medium">Descrição</label>
      <textarea id="workplace-description" name="description" defaultValue={description} maxLength={240} rows={4} className={`${fieldClass} resize-y`} />
    </div>
    <div className="flex flex-wrap items-center gap-4">
      <SubmitButton />
      {state.message && <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-foreground"}>{state.message}</p>}
    </div>
  </form>;
}
