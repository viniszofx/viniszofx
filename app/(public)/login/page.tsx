import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordButton } from "@/components/auth/password-reset";
import { LoginForm } from "@/components/login-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { hasAuthUsers } from "@/lib/auth/users";
import { isLocalAuth } from "@/lib/db";
import { signupOpen } from "@/lib/organizations/onboarding";

export const metadata: Metadata = { title: "Login | Viniccius", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const firstAccount = !await hasAuthUsers();
  return (
    <main className="flex min-h-[calc(100svh-4rem)] items-center justify-center bg-muted/30 px-4 py-12 sm:px-6">
      <Card className="w-full max-w-md bg-card/80 ring-0">
        <CardHeader className="gap-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Viniccius</p>
          <h1 className="font-heading text-2xl font-semibold">{firstAccount ? "Primeiro acesso" : "Bem-vindo de volta"}</h1>
          <CardDescription>{firstAccount ? "Ainda não há contas. Crie a primeira conta e a organização." : "Entre para acessar seu dashboard."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {firstAccount ? <Link href="/onboarding" className={buttonVariants({ size: "lg", className: "w-full" })}>Criar conta e organização</Link> : <LoginForm initialMode="sign-in" />}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">{!firstAccount && <ForgotPasswordButton localAuth={isLocalAuth} />}{!firstAccount && signupOpen() && <Link href="/onboarding" className="text-sm text-primary underline-offset-4 hover:underline">Criar conta e organização</Link>}</div>
          <Link href="/" className="block text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Voltar ao início</Link>
        </CardContent>
      </Card>
    </main>
  );
}
