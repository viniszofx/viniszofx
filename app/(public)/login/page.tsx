import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordButton } from "@/components/auth/password-reset";
import { LoginForm } from "@/components/login-form";
import { buttonVariants } from "@/components/ui/button";
import { DiamondLines } from "@/components/marketing/art";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { hasAuthUsers } from "@/lib/auth/users";
import { isLocalAuth } from "@/lib/db";
import { signupOpen } from "@/lib/organizations/onboarding";

export const metadata: Metadata = { title: "Login | Viniccius", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const firstAccount = !await hasAuthUsers();
  return (
    // .home-dark: o login fica sempre escuro, como a página inicial, e o cabeçalho esconde a troca de tema.
    <main className="home-dark relative isolate flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      {/* Padrão 01 da marca (losangos concêntricos) em cobre, atrás do cartão. */}
      <DiamondLines className="absolute inset-0 -z-10 size-full text-primary opacity-60" />
      <Card className="w-full max-w-md rounded-none bg-card/80 ring-0 backdrop-blur-md">
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
