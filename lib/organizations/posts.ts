import "server-only";
import type { PostPoll } from "@/lib/db/schema/app";

export type PostInput = { title?: unknown; body?: unknown; status?: unknown; publishAt?: unknown; expiresAt?: unknown; coverFileId?: unknown; poll?: unknown };

const uuid = /^[0-9a-f-]{36}$/;

/** Enquete: pergunta, 2 a 10 opções com id estável (os votos apontam para ele). `null` remove a enquete. */
function parsePoll(value: unknown): { poll: PostPoll | null } | { error: string } {
  if (!value || typeof value !== "object") return { poll: null };
  const input = value as Record<string, unknown>;
  const question = typeof input.question === "string" ? input.question.trim().slice(0, 300) : "";
  const options = (Array.isArray(input.options) ? input.options : []).flatMap(item => {
    if (!item || typeof item !== "object") return [];
    const option = item as Record<string, unknown>;
    const label = typeof option.label === "string" ? option.label.trim().slice(0, 120) : "";
    const id = typeof option.id === "string" && /^[\w-]{1,40}$/.test(option.id) ? option.id : "";
    return label && id ? [{ id, label }] : [];
  }).slice(0, 10);
  if (!question && !options.length) return { poll: null };
  if (!question) return { error: "Escreva a pergunta da enquete." };
  if (options.length < 2) return { error: "A enquete precisa de pelo menos duas opções." };
  if (new Set(options.map(option => option.id)).size !== options.length) return { error: "Há opções repetidas na enquete." };
  const closesAt = typeof input.closesAt === "string" && input.closesAt && !Number.isNaN(Date.parse(input.closesAt)) ? new Date(input.closesAt).toISOString() : null;
  return { poll: { question, options, multiple: input.multiple === true, closesAt } };
}

export function parsePost(input: PostInput) {
  const title = typeof input.title === "string" ? input.title.trim().slice(0, 200) : "";
  if (!title) return { error: "Informe o título." } as const;
  const date = (value: unknown) => typeof value === "string" && value && !Number.isNaN(Date.parse(value)) ? new Date(value) : null;
  const publishAt = date(input.publishAt); const expiresAt = date(input.expiresAt);
  if (publishAt && expiresAt && expiresAt <= publishAt) return { error: "O prazo deve ser posterior à publicação." } as const;
  const poll = parsePoll(input.poll);
  if ("error" in poll) return { error: poll.error } as const;
  const coverFileId = typeof input.coverFileId === "string" && uuid.test(input.coverFileId) ? input.coverFileId : null;
  return { value: { title, body: typeof input.body === "string" ? input.body.slice(0, 20_000) : "", status: input.status === "draft" ? "draft" as const : "published" as const, publishAt, expiresAt, poll: poll.poll }, coverFileId } as const;
}
