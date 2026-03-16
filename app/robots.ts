import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/funnel", "/subscribe"],
        disallow: ["/api/", "/_next/", "/dashboard", "/account", "/batch-audit"],
      },
    ],
    sitemap: "https://nexus-diagnostics.vercel.app/sitemap.xml",
  };
}