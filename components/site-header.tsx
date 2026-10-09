import Link from "next/link";
import { ThemeSelector } from "@/components/dashboard/theme-selector";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 isolate bg-background/30 bg-linear-to-b from-white/20 to-white/5 shadow-[0_8px_32px_-12px_rgb(0_0_0/0.18)] backdrop-blur-2xl backdrop-saturate-150 dark:from-white/10 dark:to-white/0">
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        <Link
          href="/"
          aria-label="Vinicius Souza — página inicial"
          className="font-heading text-xl font-semibold tracking-wider text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="hidden sm:inline">Vinicius Souza</span>
          <span className="sm:hidden">V</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6"><div className="hidden items-center gap-5 text-xs sm:flex"><Link href="/#sobre" className="hover:text-primary">Sobre</Link><Link href="/#projetos" className="hover:text-primary">Projetos</Link><Link href="/#contato" className="hover:text-primary">Contato</Link></div>
        <ThemeSelector compact />
        </div>
      </nav>
    </header>
  );
}
