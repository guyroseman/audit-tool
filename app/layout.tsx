import type { Metadata } from "next";
import "./globals.css";
import { CookieBanner } from "./components/cookie-banner";
import { AuthProvider } from "./lib/auth-context";
import { PageDecorations } from "./components/page-decorations";

export const metadata: Metadata = {
  metadataBase: new URL("https://audit-tool-beige.vercel.app"),
  title: { default: "Free Website Revenue Audit | Nexus Performance Agency", template: "%s | Nexus" },
  description: "Discover exactly how much revenue your slow website is costing you every month. Free 60-second diagnostic powered by Google PageSpeed.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website", locale: "en_GB",
    title: "Is Your Website Bleeding Revenue? Find Out Free in 60 Seconds",
    description: "Free 4-pillar diagnostic: Speed · SEO · Accessibility · Security. See the exact $ cost and how to fix it.",
    siteName: "Nexus Performance Agency",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Nexus Free Website Revenue Audit" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Website Revenue Audit",
    description: "60-second free diagnostic across 4 pillars. Real Google data.",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "WebApplication",
          "name": "Nexus Free Website Revenue Audit",
          "description": "Free 4-pillar website diagnostic: Performance, SEO, Accessibility, and Security.",
          "applicationCategory": "BusinessApplication",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "GBP" },
          "provider": { "@type": "Organization", "name": "Nexus Performance Agency" }
        }) }} />
      </head>
      <body>
        <div id="cursor" aria-hidden="true" suppressHydrationWarning />
        <div id="cursor-ring" aria-hidden="true" suppressHydrationWarning />
        <PageDecorations />
        <AuthProvider>
        <CookieBanner />
          {children}
        </AuthProvider>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var cursor = document.getElementById('cursor');
            var ring = document.getElementById('cursor-ring');
            var mx = 0, my = 0, rx = 0, ry = 0;
            document.addEventListener('mousemove', function(e) {
              mx = e.clientX; my = e.clientY;
              cursor.style.transform = 'translate(' + (mx - 6) + 'px,' + (my - 6) + 'px)';
            }, { passive: true });
            function animRing() {
              rx += (mx - rx) * 0.22; ry += (my - ry) * 0.22;
              ring.style.transform = 'translate(' + (rx - 18) + 'px,' + (ry - 18) + 'px)';
              requestAnimationFrame(animRing);
            }
            animRing();
          })();
        ` }} />
      </body>
    </html>
  );
}