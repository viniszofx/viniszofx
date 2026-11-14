import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { messageReports } from "@/lib/db/schema/app";
import { currentOrganization, unauthorized } from "@/lib/organizations/current";

type Context = { params: Promise<{ reportId: string }> };

/** Marcar denúncia como revisada, descartada ou reabrir. */
export async function PATCH(request: Request, context: Context) {
  const [organization, { reportId }] = await Promise.all([currentOrganization(), context.params]);
  if (!organization) return unauthorized();
  if (!organization.admin) return new Response("Só a administração revisa denúncias.", { status: 403 });
  const body = await request.json().catch(() => ({}));
  const status = body.status;
  if (status !== "open" && status !== "reviewed" && status !== "dismissed") return new Response("Situação inválida.", { status: 400 });
  const open = status === "open";
  const updated = await db.update(messageReports).set({ status, reviewedBy: open ? null : organization.userId, reviewedAt: open ? null : new Date() })
    .where(and(eq(messageReports.id, reportId), eq(messageReports.organizationId, organization.organizationId))).returning({ id: messageReports.id });
  if (!updated.length) return new Response("Denúncia não encontrada.", { status: 404 });
  return new Response(null, { status: 204 });
}
