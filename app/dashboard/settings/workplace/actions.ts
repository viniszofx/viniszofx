"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { workplaceSettings } from "@/lib/db/schema/app";

export type WorkplaceActionState = { status: "idle" | "success" | "error"; message: string };

export async function saveWorkplaceSettings(_previous: WorkplaceActionState, formData: FormData): Promise<WorkplaceActionState> {
  const { data: session } = await auth.getSession();
  if (!session?.user) return { status: "error", message: "Sua sessão expirou. Entre novamente." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (name.length < 2 || name.length > 60) return { status: "error", message: "O nome deve ter entre 2 e 60 caracteres." };
  if (description.length > 240) return { status: "error", message: "A descrição deve ter até 240 caracteres." };

  try {
    await db.insert(workplaceSettings).values({ userId: session.user.id, name, description })
      .onConflictDoUpdate({ target: workplaceSettings.userId, set: { name, description, updatedAt: new Date() } });
    revalidatePath("/dashboard/workspace");
    revalidatePath("/dashboard/settings/workplace");
    return { status: "success", message: "Workplace atualizado." };
  } catch {
    return { status: "error", message: "Não foi possível salvar o Workplace. Tente novamente." };
  }
}
