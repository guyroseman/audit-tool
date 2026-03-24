import { ImageResponse } from "next/og";
import { getArticle } from "../../lib/articles";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: { slug: string } }) {
  const article = getArticle(params.slug);
  const title = article?.title ?? "Nexus Blog";
  const category = article?.category ?? "Insights";
  const color = article?.categoryColor ?? "#e8341a";

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: "#080f1c", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 80px", fontFamily: "sans-serif" }}>
        {/* Top: category badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44 }}>
            <svg width="44" height="44" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)" />
              <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.7" />
            </svg>
          </div>
          <span style={{ color: "#e8341a", fontSize: 18, letterSpacing: "0.2em", fontWeight: 700 }}>NEXUS</span>
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)", marginLeft: 8, marginRight: 8 }} />
          <span style={{ color: color, fontSize: 14, letterSpacing: "0.15em", background: color + "20", padding: "4px 12px", borderRadius: 4, border: `1px solid ${color}40` }}>
            {category.toUpperCase()}
          </span>
        </div>

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ fontSize: title.length > 50 ? 44 : 52, color: "#ffffff", fontWeight: 900, lineHeight: 1.2, letterSpacing: "-0.01em", maxWidth: 900 }}>
            {title}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, letterSpacing: "0.08em" }}>nexusdiag.com</span>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 14 }}>Free website revenue audit</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
