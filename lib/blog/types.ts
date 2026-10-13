export type BlogPostData = {
  id: string;
  slug: string | null;
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  noIndex: boolean;
  adPlacements: { top: boolean; middle: boolean; bottom: boolean };
  content: string;
  document: Record<string, unknown> | null;
  coverAssetId: string | null;
  coverPosition: number;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type BlogAssetData = {
  id: string;
  name: string;
  contentType: string;
  size: number;
  createdAt: string;
};

export const blogAssetUrl = (id: string) => `/api/blog/assets/${id}`;
