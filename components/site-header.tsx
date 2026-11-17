import Link from "next/link";
import { ThemeSelector } from "@/components/dashboard/theme-selector";
import { Button } from "@/components/ui/button";
import { SiteMenu } from "@/components/site-menu";

const sections = [
  { href: "/#situacoes", label: "Exemplos" },
  { href: "/#servicos", label: "Serviços" },
  { href: "/#ia", label: "IA consciente" },
  { href: "/#projetos", label: "Projetos" },
  { href: "/#contato", label: "Contato" },
];

export function SiteHeader({ authenticated, blog = true }: { authenticated: boolean; blog?: boolean }) {
  const links = blog ? [...sections, { href: "/blog", label: "Blog" }] : sections;
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b glass-bar">
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Link
          href="/"
          aria-label="Vinicius Souza — página inicial"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* Mesma marca do cabeçalho do painel. */}
          <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-md border border-primary text-xs font-bold text-primary">V</span>
          <span className="hidden sm:inline">Vinicius Souza</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Telas grandes: links em linha. */}
          <ul className="hidden items-center gap-5 text-sm whitespace-nowrap text-muted-foreground lg:flex">
            {links.map(link => <li key={link.href}><Link href={link.href} className="hover:text-foreground">{link.label}</Link></li>)}
          </ul>
          <ThemeSelector compact />
          <Button nativeButton={false} render={<Link href={authenticated ? "/dashboard" : "/login"} />} variant="outline" size="sm" className="whitespace-nowrap normal-case tracking-normal">{authenticated ? "Ir ao app" : "Login"}</Button>
          <SiteMenu links={links} />
        </div>
      </nav>
    </header>
  );
}
