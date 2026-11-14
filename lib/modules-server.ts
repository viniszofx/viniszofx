import "server-only";
import { db } from "@/lib/db";
import { moduleSettings } from "@/lib/db/schema/app";
import { resolveDisabled } from "@/lib/modules";

/** Chaves dos módulos desligados (no banco ou por padrão). Sem a tabela (migration pendente), vale o padrão. */
export async function disabledModules() {
  try {
    return resolveDisabled(await db.select({ key: moduleSettings.key, enabled: moduleSettings.enabled }).from(moduleSettings));
  } catch (error) {
    console.error("Não foi possível ler os módulos; usando o padrão.", error);
    return resolveDisabled([]);
  }
}
