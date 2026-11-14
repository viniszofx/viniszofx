"use client";
// Copiado do Nodus.
import { type ReactNode, useState } from "react";
import { RiCheckLine, RiCloseLine, RiSearchLine } from "@remixicon/react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { lastSeenLabel } from "./people";

type Person = { id: string; name: string; avatar?: string | null; lastSeen?: string | null };

// Nova mensagem, como nos apps de conversa: folha que sobe de baixo, com Ordenar, título e fechar,
// busca em pílula e as pessoas da organização com o "visto por último". Tocar numa pessoa abre a conversa.
export function NewMessageSheet({ open, onOpenChange, people, userId, avatar, onPick }: {
  open: boolean; onOpenChange: (open: boolean) => void; people: Person[]; userId: string;
  avatar: (person: Person) => ReactNode; onPick: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "recent">("name");
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const visible = people
    .filter((person) => (person.id === userId ? "mensagens salvas" : person.name.toLocaleLowerCase("pt-BR")).includes(term))
    .sort((a, b) => a.id === userId ? -1 : b.id === userId ? 1
      : sort === "recent" ? (b.lastSeen ?? "").localeCompare(a.lastSeen ?? "") : a.name.localeCompare(b.name, "pt-BR"));
  const pill = "grid h-11 place-items-center rounded-full bg-card px-4 text-[15px] font-medium shadow-sm outline-none hover:bg-card/80 focus-visible:ring-2 focus-visible:ring-ring";

  return <Dialog open={open} onOpenChange={(next) => { if (!next) setSearch(""); onOpenChange(next); }}>
    <DialogContent showCloseButton={false}
      className="flex h-[min(44rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden bg-muted p-0 sm:max-w-md sm:p-0 max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:h-[calc(100dvh-2.5rem)] max-md:max-h-none max-md:w-full max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-t-3xl max-md:rounded-b-none max-md:data-open:slide-in-from-bottom-10">
      <div className="grid shrink-0 grid-cols-[6rem_minmax(0,1fr)_6rem] items-center px-4 pt-4 pb-3">
        <Popover>
          <PopoverTrigger render={<button type="button" className={`${pill} justify-self-start`} />}>Ordenar</PopoverTrigger>
          <PopoverContent align="start" className="w-52 rounded-2xl p-1.5">
            {([["name", "Por nome"], ["recent", "Vistos por último"]] as const).map(([value, label]) =>
              <PopoverClose key={value} aria-pressed={sort === value} onClick={() => setSort(value)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[15px] outline-none hover:bg-foreground/5 focus-visible:bg-foreground/5">
                {label}{sort === value && <RiCheckLine className="size-5 text-primary" />}
              </PopoverClose>)}
          </PopoverContent>
        </Popover>
        <DialogTitle className="truncate text-center text-lg font-semibold">Nova mensagem</DialogTitle>
        <DialogClose className="grid size-11 place-items-center justify-self-end rounded-full bg-card shadow-sm outline-none hover:bg-card/80 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Fechar" title="Fechar"><RiCloseLine className="size-6" /></DialogClose>
      </div>
      <DialogDescription className="sr-only">Escolha a pessoa para conversar.</DialogDescription>
      <label className="relative mx-4 mb-2 block shrink-0">
        <RiSearchLine aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
        <input type="search" aria-label="Buscar pessoa" placeholder="Buscar" value={search} onChange={(event) => setSearch(event.target.value)}
          className="h-10 w-full rounded-full bg-foreground/6 pr-4 pl-10 text-[17px] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden" />
      </label>
      <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {visible.map((person) => <li key={person.id}>
          <button type="button" onClick={() => onPick(person.id)} className="flex w-full items-center gap-3 py-1.5 text-left outline-none focus-visible:bg-foreground/5">
            {avatar(person)}
            <span className="min-w-0 flex-1 border-b border-foreground/10 py-1.5">
              <span className="block truncate text-[17px]">{person.id === userId ? "Mensagens salvas" : person.name}</span>
              <span className="block truncate text-[13px] text-muted-foreground">{person.id === userId ? "Envie algo para você mesmo" : lastSeenLabel(person.lastSeen ?? null)}</span>
            </span>
          </button>
        </li>)}
        {!visible.length && <li className="py-6 text-center text-sm text-muted-foreground">Nenhuma pessoa encontrada.</li>}
      </ul>
    </DialogContent>
  </Dialog>;
}
