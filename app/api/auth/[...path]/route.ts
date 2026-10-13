import { auth } from "@/lib/auth/server";
import { hasAuthUsers } from "@/lib/auth/users";

const handlers = auth.handler();
export const GET = handlers.GET;

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (path[0] === "sign-up" && path[1] === "email" && await hasAuthUsers()) {
    return Response.json({ message: "O cadastro inicial já foi concluído." }, { status: 403 });
  }
  return handlers.POST(request, context);
}
