import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard | Viniccius" };

export default function DashboardPage() {
  return (
    <main className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Área pessoal</p>
            <h1 className="font-heading text-3xl font-semibold sm:text-4xl">Home</h1>
            <p className="text-sm text-muted-foreground">Bem-vindo ao seu espaço, onde tudo começa.</p>
          </div>
          <Button nativeButton={false} render={<Link href="/login" />} variant="secondary">Voltar ao login</Button>
        </div>
        <Card className="ring-0">
          <CardHeader className="gap-3">
            <h2 className="font-heading text-xl font-semibold">Seu painel está pronto</h2>
            <CardDescription>Seus projetos e atividades poderão ser acompanhados por aqui.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/60 px-6 py-10 text-center">
              <p className="font-medium">Nenhuma atividade por enquanto</p>
              <p className="mt-2 text-sm text-muted-foreground">As próximas atualizações aparecerão neste espaço.</p>
            </div>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">Prévia demonstrativa do dashboard, sem autenticação ativa.</p>
      </div>
    </main>
  );
}
