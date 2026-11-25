"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { RiMenuLine } from "@/components/icons";

/** Menu do site em telas menores: fecha ao escolher um link, ao clicar fora ou com Esc. */
export function SiteMenu({ links }: { links: { href: string; label: string }[] }) {
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: Event) => {
      const element = menu.current;
      if (!element?.open) return;
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !element.contains(event.target as Node)) element.open = false;
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, []);
  return <details ref={menu} className="relative xl:hidden">
    <summary aria-label="Menu" className="grid size-9 cursor-pointer list-none place-items-center rounded-full outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
      <RiMenuLine className="size-5" />
    </summary>
    <ul className="absolute top-12 right-0 w-56 rounded-2xl border border-foreground/10 bg-background/95 p-2 text-sm shadow-xl backdrop-blur-2xl">
      {links.map(link => <li key={link.href}><Link href={link.href} onClick={() => { if (menu.current) menu.current.open = false; }} className="block rounded-xl px-3 py-2.5 hover:bg-foreground/5 hover:text-primary">{link.label}</Link></li>)}
    </ul>
  </details>;
}
