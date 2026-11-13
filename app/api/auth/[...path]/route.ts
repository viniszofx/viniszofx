import { handleAuthGet, handleAuthPost } from "@/lib/auth/server";
import { hasAuthUsers } from "@/lib/auth/users";
import { signupOpen } from "@/lib/organizations/onboarding";

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, context: Context) {
  return handleAuthGet(request, context);
}

export async function POST(request: Request, context: Context) {
  const { path } = await context.params;
  if (path[0] === "sign-up" && path[1] === "email" && !signupOpen() && await hasAuthUsers()) {
    return Response.json({ message: "O cadastro inicial já foi concluído." }, { status: 403 });
  }
  return handleAuthPost(request, context);
}
