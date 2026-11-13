import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { shortLinks } from "@/lib/db/schema/app";

export const metadata = { robots: { index: false, follow: false } };

export default async function ShortLinkRoute({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[a-z2-9]{7}$/.test(code)) notFound();
  const [link] = await db.select({ target: shortLinks.target }).from(shortLinks).where(eq(shortLinks.code, code)).limit(1);
  if (!link) notFound();
  redirect(link.target);
}
