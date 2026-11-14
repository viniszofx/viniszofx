"use client";
// Copiado do Nodus: avatar com degradê por pessoa e "visto por último".

// Avatar sem foto nas Mensagens: iniciais do nome e do sobrenome sobre um degradê de cor fixa por pessoa.
const gradients = [
  "from-sky-400 to-blue-600", "from-emerald-400 to-green-600", "from-amber-400 to-orange-600", "from-rose-400 to-red-600",
  "from-fuchsia-400 to-purple-600", "from-indigo-400 to-violet-600", "from-teal-400 to-cyan-600", "from-pink-400 to-rose-600",
  "from-lime-500 to-emerald-600", "from-orange-400 to-amber-600",
];

export function avatarGradient(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `bg-linear-to-br ${gradients[hash % gradients.length]}`;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(part => /\p{L}|\d/u.test(part));
  if (!parts.length) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts.at(-1)![0] : parts[0][1] ?? "";
  return `${first}${last}`.toUpperCase();
}

/** Texto do "visto por último" (sem horário quando a pessoa escondeu ou nunca abriu as mensagens). */
export function lastSeenLabel(value: string | null, now = Date.now()) {
  if (!value) return "visto recentemente";
  const minutes = Math.max(0, Math.floor((now - new Date(value).getTime()) / 60000));
  if (minutes < 2) return "online";
  if (minutes < 60) return `visto há ${minutes} min`;
  const date = new Date(value);
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (minutes < 1440 && new Date(now).toDateString() === date.toDateString()) return `visto hoje às ${time}`;
  if (minutes < 2880) return `visto ontem às ${time}`;
  return `visto em ${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
}

export type ChatPerson = { id: string; name: string; avatar?: string | null; lastSeen?: string | null; self?: boolean };

/** Online: visto há menos de 2 minutos (o app avisa a cada poucos segundos enquanto a tela está aberta). */
export const isOnline = (lastSeen: string | null | undefined, now = Date.now()) => !!lastSeen && now - new Date(lastSeen).getTime() < 2 * 60 * 1000;

/** Foto de perfil; sem foto, iniciais no degradê da pessoa. Ponto verde quando está online. */
export function Avatar({ person, size = "size-10", presence = false }: { person: ChatPerson; size?: string; presence?: boolean }) {
  const online = presence && isOnline(person.lastSeen);
  const face = person.avatar
    ? <img src={person.avatar} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
    : <span className={`grid ${size} shrink-0 place-items-center rounded-full text-sm font-semibold text-white ${avatarGradient(person.id)}`}>{person.self ? "★" : initials(person.name)}</span>;
  if (!online) return face;
  return <span className="relative shrink-0">{face}<span aria-label="Online" className="absolute right-0 bottom-0 size-3 rounded-full bg-emerald-500 ring-2 ring-background" /></span>;
}
