import { MetadataRoute } from "next";
import { articleList } from "./lib/articles";


export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexusdiag.com";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/funnel`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    ...articleList.map(a => ({
      url: `${base}/blog/${a.slug}`,
      lastModified: new Date(a.isoDate),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${base}/subscribe`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/legal/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/refund`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];
}