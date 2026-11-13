import { auth } from "@/lib/auth/server";
import { sameOrigin } from "@/lib/organizations/guard";
import { canOnboard, createOrganizationFor, parseCompany } from "@/lib/organizations/onboarding";

/** Se a conta pode criar a organização agora (botão "Criar organização"). */
export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return Response.json({ canCreate: false }, { status: 401 });
  return Response.json({ canCreate: await canOnboard(session.user.id) }, { headers: { "Cache-Control": "private, no-store" } });
}

/** Onboarding: cria a organização da conta recém-criada (ou do admin sem organização). */
export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return Response.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  if (!await canOnboard(session.user.id)) return Response.json({ error: "Sua conta já está em uma organização ou não pode criar uma." }, { status: 403 });
  const parsed = parseCompany(await request.json().catch(() => null));
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });
  const organizationId = await createOrganizationFor(session.user.id, parsed.value);
  return Response.json({ organizationId }, { status: 201 });
}
