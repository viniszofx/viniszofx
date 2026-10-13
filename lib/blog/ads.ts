import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogAdSlots } from "@/lib/db/schema/app";

export const adPositions = ["top", "middle", "bottom"] as const;
export type AdPosition = typeof adPositions[number];
export type AdSlotData = { position: AdPosition; enabled: boolean; advertiser: string; headline: string;
  description: string; targetUrl: string; imageUrl: string; updatedAt: string | null };

export function blankAd(position: AdPosition): AdSlotData {
  return { position, enabled: false, advertiser: "", headline: "", description: "", targetUrl: "", imageUrl: "", updatedAt: null };
}

export async function listAdSlots(authorId: string): Promise<AdSlotData[]> {
  const rows = await db.select().from(blogAdSlots).where(eq(blogAdSlots.authorId, authorId));
  return adPositions.map((position) => {
    const row = rows.find((item) => item.position === position);
    return row ? { position, enabled: row.enabled, advertiser: row.advertiser, headline: row.headline,
      description: row.description, targetUrl: row.targetUrl, imageUrl: row.imageUrl,
      updatedAt: row.updatedAt.toISOString() } : blankAd(position);
  });
}

export function isReadyAd(ad: AdSlotData) {
  return ad.enabled && !!ad.headline && !!ad.targetUrl;
}
