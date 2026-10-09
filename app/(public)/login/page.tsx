import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Login | Viniccius" };

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100svh-4rem)] items-center justify-center bg-muted/30 px-4 py-12 sm:px-6">
      <Card className="w-full max-w-md bg-card/80 ring-0">
        <CardHeader className="gap-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Viniccius</p>
          <h1 className="font-heading text-2xl font-semibold">Bem-vindo de volta</h1>
          <CardDescription>Entre para acessar seu dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LoginForm />
          <Link href="/" className="block text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Voltar ao início</Link>
        </CardContent>
      </Card>
    </main>
  );
}
