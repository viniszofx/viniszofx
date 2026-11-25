import Link from "next/link";
import { RiAddLine as Plus } from "@remixicon/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { SiteMenu } from "@/components/site-menu";

const sections = [
  { href: "/#casos", label: "Casos" },
  { href: "/#servicos", label: "Serviços" },
  { href: "/#projetos", label: "Projetos" },
  { href: "/#sobre", label: "Sobre" },
  { href: "/#contato", label: "Contato" },
];

/** Cabeçalho editorial: a marca numa barra laranja à esquerda (como a capa de um relatório) e a navegação à direita. */
export function SiteHeader({ authenticated, blog = true }: { authenticated: boolean; blog?: boolean }) {
  const links = blog ? [...sections, { href: "/blog", label: "Blog" }] : sections;
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-stretch border-b border-foreground bg-background [:root:has(.home-intro)_&]:animate-header-in motion-reduce:animate-none">

      <div className="paper flex min-w-0 flex-1 items-center justify-between gap-4 bg-orange px-4 text-black sm:px-6 lg:max-w-[50%]">
        <Link
          href="/"
          aria-label="Vinicius Souza — página inicial"
          className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-xl font-medium tracking-[-0.05em] outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          {/* Símbolo "Vinicius." (o mesmo de app/icon.svg e docs/brand/assets/Marca/simbolo-v.svg). */}
          <svg aria-hidden="true" viewBox="0 0 32 32" className="size-8 shrink-0"><rect width="32" height="32" fill="#000" /><path d="M6 7h5.5L16 19.5 20.5 7H26l-7.5 18h-5z" fill="#fff" /><rect x="22" y="21" width="4" height="4" fill="#fe7141" /></svg>
          <span className="hidden sm:inline">Vinicius Souza</span>
        </Link>
        <Link href="/#processos" className="hidden items-center gap-1 text-[0.95rem] font-medium whitespace-nowrap underline-offset-4 hover:underline md:inline-flex">Ler os capítulos<Plus className="size-4" /></Link>
      </div>
      <nav aria-label="Navegação principal" className="flex shrink-0 items-center justify-end gap-3 px-4 sm:gap-6 sm:px-6 lg:flex-1">
        <ul className="hidden items-center gap-6 text-[0.95rem] whitespace-nowrap xl:flex">
          {links.map(link => <li key={link.href}><Link href={link.href} className="underline-offset-4 hover:underline">{link.label}</Link></li>)}
        </ul>
        <ThemeToggle />
        {/* Contorno, não cheio: o único botão preto cheio da página é o "Quero uma proposta". Link simples, sem JavaScript. */}
        <Link href={authenticated ? "/dashboard" : "/login"} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "whitespace-nowrap")}>{authenticated ? "Ir ao app" : "Área privada"}</Link>
        <SiteMenu links={links} />
      </nav>
    </header>
  );
}
