import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog", "/blog/", "/funnel", "/subscribe", "/about", "/legal", "/london-website-audit", "/new-york-website-audit", "/ecommerce-website-audit", "/los-angeles-website-audit", "/manchester-website-audit", "/chicago-website-audit", "/shopify-website-audit"],
        disallow: ["/api/", "/_next/", "/dashboard", "/account", "/batch-audit", "/admin", "/call-center"],
      },
    ],
    sitemap: "https://nexusdiag.com/sitemap.xml",
  };
}