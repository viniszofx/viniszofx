import "server-only";

export type PostInput = { title?: unknown; body?: unknown; status?: unknown; publishAt?: unknown; expiresAt?: unknown };

export function parsePost(input: PostInput) {
  const title = typeof input.title === "string" ? input.title.trim().slice(0, 200) : "";
  if (!title) return { error: "Informe o título." } as const;
  const date = (value: unknown) => typeof value === "string" && value && !Number.isNaN(Date.parse(value)) ? new Date(value) : null;
  const publishAt = date(input.publishAt); const expiresAt = date(input.expiresAt);
  if (publishAt && expiresAt && expiresAt <= publishAt) return { error: "O prazo deve ser posterior à publicação." } as const;
  return { value: { title, body: typeof input.body === "string" ? input.body.slice(0, 20_000) : "", status: input.status === "draft" ? "draft" as const : "published" as const, publishAt, expiresAt } } as const;
}
