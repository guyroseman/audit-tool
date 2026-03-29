import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog", "/blog/", "/funnel", "/subscribe", "/about", "/legal"],
        disallow: ["/api/", "/_next/", "/dashboard", "/account", "/batch-audit", "/admin", "/call-center"],
      },
    ],
    sitemap: "https://nexusdiag.com/sitemap.xml",
  };
}