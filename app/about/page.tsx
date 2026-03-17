"use client";
import { motion } from "framer-motion";
import { NavBar } from "../components/nav";

const TESTIMONIALS = [
  { name: "James H.", role: "SaaS Founder, Manchester", stat: "$2,400/mo recovered", quote: "Found out our hero image was 8MB. One fix. Google Ads CPC dropped 28% the following week. Nexus paid for four years of subscription in a single afternoon." },
  { name: "Marcus T.", role: "Law Firm Partner, Chicago", stat: "$50k lawsuit avoided", quote: "We were HIGH ADA risk with three failing WCAG checks. Nexus caught it before a law firm letter did. Fixed in a week, compliance certificate on file." },
  { name: "Asha P.", role: "E-commerce Director, Sydney", stat: "$12k ad spend recovered", quote: "A third-party script was adding 3.2 seconds to every page load and I had no idea. Nexus showed me the exact filename. Dev fixed it that afternoon." },
  { name: "Tom W.", role: "Agency Owner, London", stat: "12 retainer clients closed", quote: "I show prospects their own Nexus leak number before I even pitch. They see the bleeding dollar figure and they are already sold." },
];

const TEAM = [
  { name: "Alex Rivera", role: "Founder & CEO", bio: "10 years running performance agencies. Watched too many founders blame their agency for problems that lived inside their own site code." },
  { name: "Sarah Chen", role: "Head of Engineering", bio: "Ex-Google infrastructure. Built the 4-pillar audit engine that turns raw Lighthouse data into plain-English dollar impact." },
  { name: "Daniel Brooks", role: "Head of Product", bio: "Former SaaS founder. Designed the funnel and report experience so non-technical operators can act on findings without a developer in the room." },
];

const VALUES = [
  { icon: "💡", title: "Plain English, always", body: "Technical data is worthless if only engineers can read it. Every number in our reports has a real-world business translation." },
  { icon: "🎯", title: "Dollar impact first", body: "We do not report raw milliseconds. We report revenue impact. Founders make decisions on money, not benchmarks." },
  { icon: "🔒", title: "Real data, not simulation", body: "Every scan calls the official Google PageSpeed Insights API. The same data your developer would use. No synthetic benchmarks." },
  { icon: "⚡", title: "Speed is the point", body: "A 60-second scan. A report you can act on today. We built this because slow feedback loops cost money." },
];

export default function About() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <NavBar page="about" maxWidth={1280} />

      {/* Hero */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(60px,10vw,100px) 20px 0" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: 100, background: "rgba(232,52,26,0.08)", border: "1px solid rgba(232,52,26,0.22)", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.12em", marginBottom: 26 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
            OUR MISSION
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px,9vw,96px)", lineHeight: 0.9, letterSpacing: "0.02em", marginBottom: 28 }}>
            WE MAKE THE<br />
            <span style={{ color: "var(--accent)" }}>INVISIBLE</span><br />
            VISIBLE.
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "clamp(15px,2vw,18px)", color: "var(--text2)", lineHeight: 1.75, maxWidth: 580, margin: "0 auto" }}>
            Nexus was built for one reason: most websites are silently costing their owners money every single day, and nobody tells them. We fix that with a 60-second scan and a report any founder can act on.
          </p>
        </motion.div>
      </section>

      {/* Story */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(60px,8vw,96px) 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }} className="about-story-grid">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.18em", marginBottom: 14 }}>THE STORY</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4vw,48px)", lineHeight: 1.0, letterSpacing: "0.04em", marginBottom: 22 }}>
              BUILT AFTER WATCHING<br />
              <span style={{ color: "var(--accent)" }}>ONE TOO MANY</span><br />
              FOUNDERS FAIL.
            </h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text2)", lineHeight: 1.75, marginBottom: 16 }}>
              We ran a web performance agency for ten years. Every month we watched founders spend thousands on ads, redesigns, and consultants while the real problem sat untouched in their site&rsquo;s Lighthouse report.
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text2)", lineHeight: 1.75, marginBottom: 16 }}>
              The data was always there. But it was in raw milliseconds and audit codes that meant nothing to a business owner. So they ignored it. Or they paid an agency to translate it for them.
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text2)", lineHeight: 1.75 }}>
              Nexus is what we built so nobody needs the agency. You paste a URL, you get a dollar figure, you know what to fix and in what order. That is the entire product.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { n: "500+", label: "Sites audited", color: "#10b981" },
              { n: "$2,100", label: "Average monthly leak recovered per user", color: "var(--accent)" },
              { n: "60s", label: "Time from URL to full report", color: "#a78bfa" },
              { n: "4", label: "Pillars checked on every scan", color: "#f59e0b" },
            ].map(({ n, label, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 20px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 36, color, letterSpacing: "0.02em", lineHeight: 1, flexShrink: 0, minWidth: 72 }}>{n}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.5 }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "clamp(56px,8vw,96px) 20px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.18em", marginBottom: 10 }}>HOW WE THINK</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4.5vw,50px)", letterSpacing: "0.04em", lineHeight: 1 }}>
              OUR <span style={{ color: "var(--accent)" }}>PRINCIPLES</span>
            </h2>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            {VALUES.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                style={{ padding: "24px 22px", borderRadius: 14, background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{v.icon}</div>
                <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 8 }}>{v.title}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>{v.body}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(56px,8vw,96px) 20px" }}>
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 36 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.18em", marginBottom: 12 }}>WHAT HAPPENS AFTER THE SCAN</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4.5vw,50px)", letterSpacing: "0.04em", lineHeight: 1 }}>
            REAL RESULTS. <span style={{ color: "#a78bfa" }}>REAL COMPANIES.</span>
          </h2>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              style={{ padding: "24px 22px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "inline-flex", padding: "3px 10px", borderRadius: 4, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.22)", marginBottom: 14, alignSelf: "flex-start" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#a78bfa", letterSpacing: "0.1em" }}>{t.stat}</span>
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text2)", lineHeight: 1.72, fontStyle: "italic", flex: 1, marginBottom: 16 }}>&ldquo;{t.quote}&rdquo;</p>
              <div>
                <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13, color: "var(--text)" }}>{t.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", marginTop: 3, letterSpacing: "0.06em" }}>{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "clamp(56px,8vw,96px) 20px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: "center", marginBottom: 36 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.18em", marginBottom: 12 }}>THE PEOPLE BEHIND NEXUS</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4.5vw,50px)", letterSpacing: "0.04em", lineHeight: 1 }}>
              THE <span style={{ color: "var(--accent)" }}>TEAM</span>
            </h2>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, maxWidth: 940, margin: "0 auto" }}>
            {TEAM.map((m, i) => (
              <motion.div key={m.name} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                style={{ padding: "28px 24px", borderRadius: 14, background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--surface2)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 22, color: "var(--accent)", marginBottom: 16 }}>
                  {m.name.charAt(0)}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.1em", marginBottom: 12 }}>{m.role}</div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>{m.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(60px,8vw,96px) 20px" }}>
        <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,6vw,64px)", lineHeight: 0.94, letterSpacing: "0.02em", marginBottom: 20 }}>
            SEE WHAT YOUR<br />
            <span style={{ color: "var(--accent)", textShadow: "0 0 60px rgba(232,52,26,0.4)" }}>SITE IS HIDING</span><br />
            FROM YOU.
          </h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text2)", lineHeight: 1.72, marginBottom: 28 }}>
            Free 60-second audit. No signup. No credit card. Just your leak number and a fix plan.
          </p>
          <a href="/funnel" className="btn-primary" style={{ display: "inline-block", padding: "17px 44px", borderRadius: 10, fontSize: 14, textDecoration: "none", letterSpacing: "0.14em", boxShadow: "0 0 30px rgba(232,52,26,0.4)" }}>
            RUN MY FREE AUDIT →
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "22px 20px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--muted)", letterSpacing: "0.1em" }}>NEXUS</span>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[["PRICING", "/subscribe"], ["ABOUT", "/about"], ["FREE AUDIT", "/funnel"]].map(([l, h]) => (
              <a key={l} href={h} style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", textDecoration: "none", letterSpacing: "0.08em" }}>{l}</a>
            ))}
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)" }}>© {new Date().getFullYear()} Nexus Diagnostics</p>
        </div>
      </footer>
    </main>
  );
}
