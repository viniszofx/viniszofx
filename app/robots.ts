import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/site-url";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: ["/", "/api/blog/assets/"],
    disallow: ["/dashboard/", "/login", "/api/blog/posts/", "/api/auth/", "/api/data/"] },
    sitemap: siteUrl("/sitemap.xml") };
}
