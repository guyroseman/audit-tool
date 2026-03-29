import { MetadataRoute } from "next";
import { articleList } from "./lib/articles";


export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexusdiag.com";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/funnel`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ...articleList.map(a => ({
      url: `${base}/blog/${a.slug}`,
      lastModified: new Date(a.isoDate),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    { url: `${base}/subscribe`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/london-website-audit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/new-york-website-audit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/ecommerce-website-audit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/legal/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/refund`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];
}