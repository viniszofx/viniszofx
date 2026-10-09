import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings | Viniccius" };

export default function SettingsPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Configurações</p>
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Este será o espaço para gerenciar suas preferências.</p>
      </div>
      <section className="space-y-3 bg-card p-6 sm:p-8">
        <h2 className="font-heading text-xl font-semibold">Preferências da conta</h2>
        <p className="text-sm text-muted-foreground">As opções de configuração estarão disponíveis nas próximas atualizações.</p>
      </section>
    </main>
  );
}
