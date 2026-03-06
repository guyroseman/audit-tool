import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/funnel"],
        disallow: ["/api/", "/_next/", "/static/"],
      },
    ],
    sitemap: "https://audit-tool-beige.vercel.app/sitemap.xml",
  };
}