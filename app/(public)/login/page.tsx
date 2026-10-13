import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { hasAuthUsers } from "@/lib/auth/users";

export const metadata: Metadata = { title: "Login | Viniccius", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const hasUsers = await hasAuthUsers();
  return (
    <main className="flex min-h-[calc(100svh-4rem)] items-center justify-center bg-muted/30 px-4 py-12 sm:px-6">
      <Card className="w-full max-w-md bg-card/80 ring-0">
        <CardHeader className="gap-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Viniccius</p>
          <h1 className="font-heading text-2xl font-semibold">{hasUsers ? "Bem-vindo de volta" : "Crie sua conta"}</h1>
          <CardDescription>{hasUsers ? "Entre para acessar seu dashboard." : "Cadastre a primeira conta para começar."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LoginForm initialMode={hasUsers ? "sign-in" : "sign-up"} />
          <Link href="/" className="block text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Voltar ao início</Link>
        </CardContent>
      </Card>
    </main>
  );
}
