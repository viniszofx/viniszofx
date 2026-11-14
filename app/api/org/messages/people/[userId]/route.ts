import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema/app";
import { currentOrganization, organizationPeople, unauthorized } from "@/lib/organizations/current";
import { avatarUrl, presenceOf } from "@/lib/organizations/messages";

type Context = { params: Promise<{ userId: string }> };

/** Perfil de alguém da organização, aberto a partir da conversa. */
export async function GET(_request: Request, context: Context) {
  const [organization, { userId }] = await Promise.all([currentOrganization(), context.params]);
  if (!organization) return unauthorized();
  const person = (await organizationPeople(organization.organizationId)).find(item => item.id === userId);
  if (!person) return new Response("Essa pessoa não está nesta organização.", { status: 404 });
  const [[profile], presence] = await Promise.all([
    db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1),
    presenceOf(organization.organizationId, organization.userId),
  ]);
  return Response.json({
    id: person.id, name: person.name || person.email, email: person.email, role: person.role,
    username: profile?.username ?? "", bio: profile?.bio ?? "", avatar: avatarUrl(person.id, profile?.avatarFileId),
    lastSeen: userId === organization.userId ? null : presence.seen.get(userId) ?? null,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
