import { db } from "@/lib/db";
import { messagePresence } from "@/lib/db/schema/app";
import { currentOrganization, unauthorized } from "@/lib/organizations/current";

/** Esconder ou mostrar o próprio "visto por último" (quem esconde também deixa de ver o dos outros). */
export async function PUT(request: Request) {
  const context = await currentOrganization();
  if (!context) return unauthorized();
  const body = await request.json().catch(() => ({}));
  if (typeof body.hidden !== "boolean") return new Response("Informe se o visto por último fica escondido.", { status: 400 });
  await db.insert(messagePresence).values({ organizationId: context.organizationId, userId: context.userId, hidden: body.hidden })
    .onConflictDoUpdate({ target: [messagePresence.organizationId, messagePresence.userId], set: { hidden: body.hidden } });
  return new Response(null, { status: 204 });
}
