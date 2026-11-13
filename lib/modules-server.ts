import "server-only";
import { db } from "@/lib/db";
import { moduleSettings } from "@/lib/db/schema/app";
import { resolveDisabled } from "@/lib/modules";

/** Chaves dos módulos desligados (no banco ou por padrão). */
export async function disabledModules() {
  return resolveDisabled(await db.select({ key: moduleSettings.key, enabled: moduleSettings.enabled }).from(moduleSettings));
}
