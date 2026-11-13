import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/password-reset";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Nova senha | Viniccius", robots: { index: false, follow: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams;
  return <main className="flex min-h-[calc(100svh-4rem)] items-center justify-center bg-muted/30 px-4 py-12 sm:px-6">
    <Card className="w-full max-w-md bg-card/80 ring-0">
      <CardHeader className="gap-3 text-center"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Viniccius</p><h1 className="font-heading text-2xl font-semibold">Criar nova senha</h1><CardDescription>Escolha uma senha nova para a sua conta.</CardDescription></CardHeader>
      <CardContent><ResetPasswordForm token={typeof token === "string" ? token : ""} /></CardContent>
    </Card>
  </main>;
}
