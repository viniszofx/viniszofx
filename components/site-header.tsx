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
    <header className="fixed inset-x-0 top-0 z-50 isolate bg-background/30 bg-linear-to-b from-white/20 to-white/5 shadow-[0_8px_32px_-12px_rgb(0_0_0/0.18)] backdrop-blur-2xl backdrop-saturate-150 dark:from-white/10 dark:to-white/0">
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Link
          href="/"
          aria-label="Vinicius Souza — página inicial"
          className="shrink-0 whitespace-nowrap font-heading text-xl font-semibold tracking-wider text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="hidden sm:inline">Vinicius Souza</span>
          <span className="sm:hidden">V</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Telas grandes: links em linha. */}
          <ul className="hidden items-center gap-5 text-xs whitespace-nowrap lg:flex">
            {links.map(link => <li key={link.href}><Link href={link.href} className="hover:text-primary">{link.label}</Link></li>)}
          </ul>
          <ThemeSelector compact />
          <Button nativeButton={false} render={<Link href={authenticated ? "/dashboard" : "/login"} />} variant="outline" size="sm" className="whitespace-nowrap">{authenticated ? "Ir ao app" : "Login"}</Button>
          <SiteMenu links={links} />
        </div>
      </nav>
    </header>
  );
}
