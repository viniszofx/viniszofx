import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RiArrowLeftLine as ArrowLeft } from "@remixicon/react";
import { AdSlot, ArticleContent } from "@/components/blog/article-content";
import { getPublishedPost } from "@/lib/blog/posts";
import { blogAssetUrl } from "@/lib/blog/types";
import { siteUrl } from "@/lib/seo/site-url";
import { isReadyAd, listAdSlots } from "@/lib/blog/ads";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Artigo não encontrado" };
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || post.content.slice(0, 160);
  const url = siteUrl(`/blog/${post.slug}`);
  const image = post.coverAssetId ? siteUrl(blogAssetUrl(post.coverAssetId)) : undefined;
  return { title, description, alternates: { canonical: url },
    robots: { index: !post.noIndex, follow: !post.noIndex },
    openGraph: { title, description, url, type: "article", locale: "pt_BR",
      publishedTime: post.publishedAt?.toISOString(), modifiedTime: post.updatedAt.toISOString(), images: image ? [image] : [] },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : [] } };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();
  const ads = await listAdSlots(post.authorId);
  const adFor = (position: "top" | "middle" | "bottom") => {
    const ad = ads.find((item) => item.position === position);
    return post.adPlacements[position] && ad && isReadyAd(ad) ? ad : null;
  };
  const topAd = adFor("top");
  const middleAd = adFor("middle");
  const bottomAd = adFor("bottom");
  const url = siteUrl(`/blog/${post.slug}`);
  const description = post.seoDescription || post.excerpt || post.content.slice(0, 160);
  const structuredData = { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title,
    description, mainEntityOfPage: url, datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(), author: { "@type": "Person", name: "Vinicius Souza" },
    ...(post.coverAssetId ? { image: siteUrl(blogAssetUrl(post.coverAssetId)) } : {}) };
  return <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" />Voltar ao blog</Link>
    <article className="mt-8">
      <header className="border-b pb-8"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Blog</p><h1 className="mt-4 font-heading text-3xl font-semibold leading-tight sm:text-5xl">{post.title}</h1>{post.excerpt && <p className="mt-5 text-lg leading-7 text-muted-foreground">{post.excerpt}</p>}<time dateTime={post.publishedAt?.toISOString()} className="mt-5 block text-sm text-muted-foreground">{post.publishedAt?.toLocaleDateString("pt-BR")}</time></header>
      {post.coverAssetId && <div className="relative mt-8 aspect-[16/9] overflow-hidden bg-muted"><Image src={blogAssetUrl(post.coverAssetId)} alt="" fill sizes="(max-width: 896px) 100vw, 896px" unoptimized className="object-cover" style={{ objectPosition: `center ${post.coverPosition}%` }} /></div>}
      {topAd && <AdSlot ad={topAd} />}
      <div className="mt-9"><ArticleContent content={post.content} document={post.document} adMiddle={middleAd} /></div>
      {bottomAd && <AdSlot ad={bottomAd} />}
    </article>
  </main>;
}
