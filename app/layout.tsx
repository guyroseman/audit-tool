import type { Metadata } from "next";
import "./globals.css";

// ── SEO-hardened metadata ──────────────────────────────────────────────────────
// NOTE: The audit tool logic lives behind /funnel and /api/capture.
// This layout protects source exposure via headers set in next.config.ts.

export const metadata: Metadata = {
  metadataBase: new URL("https://audit-tool-beige.vercel.app"),
  title: {
    default: "Free Website Revenue Audit | Nexus Performance Agency",
    template: "%s | Nexus",
  },
  description:
    "Discover exactly how much revenue your slow website is costing you every month. Free 60-second diagnostic powered by Google PageSpeed. Used by 500+ businesses.",
  keywords: [
    "website speed audit",
    "page speed test",
    "website performance",
    "core web vitals",
    "conversion rate optimisation",
    "website revenue loss",
    "landing page speed",
    "google pagespeed insights",
    "web performance agency",
    "CRO agency",
  ],
  authors: [{ name: "Nexus Performance Agency" }],
  creator: "Nexus",
  publisher: "Nexus",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    title: "Is Your Website Bleeding Revenue? Find Out Free in 60 Seconds",
    description:
      "Our free diagnostic tool shows you the exact dollar cost of your site's slow performance — and the 4 ways we fix it. Takes 60 seconds.",
    siteName: "Nexus Performance Agency",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nexus Free Website Revenue Audit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Website Revenue Audit — See What Your Slow Site Is Costing You",
    description:
      "60-second free diagnostic. Real Google data. See your performance score, estimated revenue leak, and exactly how to fix it.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/",
  },
  other: {
    // Prevent search engines from indexing API routes
    "google-site-verification": "add-your-verification-code-here",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Nexus Free Website Revenue Audit",
              "description": "Free website performance diagnostic that calculates your revenue loss from slow page speeds.",
              "applicationCategory": "BusinessApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "provider": {
                "@type": "Organization",
                "name": "Nexus Performance Agency",
                "description": "Web performance and conversion optimisation agency"
              }
            })
          }}
        />
      </head>
      <body>
        {/* Custom cursor */}
        <div id="cursor" aria-hidden="true" />
        <div id="cursor-ring" aria-hidden="true" />
        {/* Scanline effect */}
        <div className="scanline" aria-hidden="true" />
        {/* Corner brackets */}
        <div className="corner-bracket tl" aria-hidden="true" />
        <div className="corner-bracket tr" aria-hidden="true" />
        <div className="corner-bracket bl" aria-hidden="true" />
        <div className="corner-bracket br" aria-hidden="true" />
        {children}
        {/* Cursor JS */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var cursor = document.getElementById('cursor');
            var ring = document.getElementById('cursor-ring');
            var mx = 0, my = 0, rx = 0, ry = 0;
            // Track raw mouse — no lag on the dot
            document.addEventListener('mousemove', function(e) {
              mx = e.clientX; my = e.clientY;
              cursor.style.transform = 'translate(' + (mx - 6) + 'px,' + (my - 6) + 'px)';
            }, { passive: true });
            // Ring follows with slight spring — faster lerp = less lag
            function animRing() {
              rx += (mx - rx) * 0.22;
              ry += (my - ry) * 0.22;
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