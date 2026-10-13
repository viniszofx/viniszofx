import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { workplaceSettings } from "@/lib/db/schema/app";

export const defaultWorkplace = {
  name: "Meu Workplace",
  description: "Notas e quadros em um só lugar.",
};

export async function getWorkplaceSettings(userId: string) {
  const [settings] = await db.select({ name: workplaceSettings.name, description: workplaceSettings.description })
    .from(workplaceSettings).where(eq(workplaceSettings.userId, userId)).limit(1);
  return settings ?? defaultWorkplace;
}
