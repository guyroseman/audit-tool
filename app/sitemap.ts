import { MetadataRoute } from "next";
import { articleList } from "./lib/articles";
import { cities, verticals, competitors } from "./lib/seo-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexusdiag.com";
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/funnel`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/subscribe`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },

    ...articleList.map(a => ({
      url: `${base}/blog/${a.slug}`,
      lastModified: new Date(a.isoDate),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),

    ...cities.map(c => ({
      url: `${base}/${c.slug}-website-audit`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    ...verticals.map(v => ({
      url: `${base}/${v.slug}-website-audit`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),

    ...competitors.map(c => ({
      url: `${base}/nexus-vs-${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),

    { url: `${base}/legal/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/legal/refund`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
}
