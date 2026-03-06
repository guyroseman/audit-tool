"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAudit, fmtMs, scoreColor, metricStatus } from "../lib/audit";
import type { AuditResult } from "../lib/audit";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TrackedSite {
  id: string; url: string; label: string; isOwn: boolean;
  result: AuditResult | null;
  history: { ts: number; score: number }[];
  loading: boolean; error: string;
}
type Tab = "overview" | "sites" | "alerts" | "settings";

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color, w = 80, h = 28 }: { data: number[]; color: string; w?: number; h?: number }) {
  if (data.length < 2) return <div style={{ width: w, height: h }} />;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      {/* last dot */}
      {data.length > 0 && (() => {
        const last = data[data.length - 1];
        const x = w, y = h - ((last - min) / range) * (h - 4) - 2;
        return <circle cx={x} cy={y} r={2.5} fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />;
      })()}
    </svg>
  );
}

// ─── Score ring (small) ───────────────────────────────────────────────────────
function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = size * 0.38, circ = 2 * Math.PI * r, color = scoreColor(score);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={3} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ}
          style={{ transition: "stroke-dashoffset 1s ease", filter: `drop-shadow(0 0 4px ${color})` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: size * 0.28, color, lineHeight: 1, letterSpacing: "0.02em" }}>{score}</span>
      </div>
    </div>
  );
}

// ─── Metric mini chip ─────────────────────────────────────────────────────────
function MetricChip({ label, value, status }: { label: string; value: string; status: "ok"|"warn"|"bad" }) {
  const c = { ok: "#10b981", warn: "#f59e0b", bad: "#e8341a" }[status];
  return (
    <div style={{ padding: "8px 10px", borderRadius: 7, background: "var(--surface2)", border: `1px solid ${c}20` }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", letterSpacing: "0.12em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: c, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

// ─── Site card ────────────────────────────────────────────────────────────────
function SiteCard({ site, onScan, onRemove }: { site: TrackedSite; onScan: () => void; onRemove: () => void; }) {
  const [open, setOpen] = useState(false);
  const r = site.result;
  const score = r?.metrics.performanceScore;
  const prevScore = site.history.length > 1 ? site.history[site.history.length - 2]?.score : undefined;
  const delta = (prevScore !== undefined && score !== undefined) ? score - prevScore : 0;
  const sev = r ? { critical: "#e8341a", warning: "#f59e0b", ok: "#10b981" }[r.severity] : "var(--muted)";

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${site.isOwn ? "rgba(232,52,26,0.25)" : "var(--border)"}`, background: site.isOwn ? "rgba(232,52,26,0.03)" : "var(--surface)", marginBottom: 8 }}>

      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        {/* Score ring or loading */}
        {site.loading ? (
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: "3px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              style={{ width: 16, height: 16, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%" }} />
          </div>
        ) : score !== undefined ? (
          <ScoreRing score={score} />
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: "3px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>—</span>
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{site.label}</span>
            {site.isOwn && <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--accent)", background: "rgba(232,52,26,0.1)", border: "1px solid rgba(232,52,26,0.2)", padding: "1px 5px", borderRadius: 3, letterSpacing: "0.1em", flexShrink: 0 }}>YOUR SITE</span>}
            {delta !== 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: delta > 0 ? "#10b981" : "#e8341a", background: delta > 0 ? "rgba(16,185,129,0.1)" : "rgba(232,52,26,0.1)", padding: "1px 5px", borderRadius: 3, flexShrink: 0 }}>{delta > 0 ? "+" : ""}{delta}</span>}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{site.url.replace(/https?:\/\//, "")}</div>
          {r && <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: sev, letterSpacing: "0.1em", marginTop: 3 }}>{r.severity.toUpperCase()} · Ad loss {r.adLossPercent}%</div>}
          {site.error && <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", marginTop: 3 }}>⚠ {site.error}</div>}
        </div>

        {/* Sparkline */}
        {site.history.length > 1 && (
          <div style={{ flexShrink: 0 }}>
            <Sparkline data={site.history.map(h => h.score)} color={score !== undefined ? scoreColor(score) : "var(--muted)"} />
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          <button onClick={onScan} disabled={site.loading} title="Scan now"
            style={{ width: 28, height: 28, borderRadius: 6, background: "none", border: "1px solid var(--border2)", cursor: "none", color: "var(--muted)", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>↺</button>
          <button onClick={() => setOpen(p => !p)} title="Details"
            style={{ width: 28, height: 28, borderRadius: 6, background: "none", border: "1px solid var(--border2)", cursor: "none", color: "var(--muted)", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.span animate={{ rotate: open ? 180 : 0 }}>▼</motion.span>
          </button>
          {!site.isOwn && (
            <button onClick={onRemove} title="Remove"
              style={{ width: 28, height: 28, borderRadius: 6, background: "none", border: "1px solid var(--border2)", cursor: "none", color: "var(--muted)", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          )}
        </div>
      </div>

      {/* Expanded vitals */}
      <AnimatePresence>
        {open && r && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: "hidden" }}>
            <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginTop: 14 }}>
                <MetricChip label="LCP" value={fmtMs(r.metrics.lcp)} status={metricStatus(r.metrics.lcp,[2500,4000])} />
                <MetricChip label="FCP" value={fmtMs(r.metrics.fcp)} status={metricStatus(r.metrics.fcp,[1800,3000])} />
                <MetricChip label="TBT" value={fmtMs(r.metrics.tbt)} status={metricStatus(r.metrics.tbt,[200,600])} />
                <MetricChip label="CLS" value={r.metrics.cls.toFixed(3)} status={metricStatus(r.metrics.cls,[0.1,0.25])} />
                <MetricChip label="Speed Index" value={fmtMs(r.metrics.speedIndex)} status={metricStatus(r.metrics.speedIndex,[3400,5800])} />
                <MetricChip label="Annual Leak" value={`£${Math.round(r.annualRevenueLoss/1000)}k`} status={r.annualRevenueLoss > 50000 ? "bad" : r.annualRevenueLoss > 20000 ? "warn" : "ok"} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)" }}>Scanned {new Date(r.timestamp).toLocaleString()}</span>
                <a href={`/?url=${encodeURIComponent(r.url)}`} style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", textDecoration: "none", border: "1px solid rgba(232,52,26,0.25)", padding: "3px 8px", borderRadius: 4 }}>Full report →</a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Add site row ─────────────────────────────────────────────────────────────
function AddSiteRow({ onAdd, disabled }: { onAdd: (url: string, label: string, isOwn: boolean) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(""); const [label, setLabel] = useState(""); const [isOwn, setIsOwn] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);

  function submit() {
    if (!url.trim()) return;
    onAdd(url.trim(), label.trim() || url.replace(/https?:\/\//, "").replace(/\/$/, ""), isOwn);
    setUrl(""); setLabel(""); setIsOwn(false); setOpen(false);
  }

  useEffect(() => { if (open) setTimeout(() => urlRef.current?.focus(), 50); }, [open]);

  if (disabled) return (
    <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.18)", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#a78bfa" }}>3 competitor slots used — Pulse plan</span>
      <a href="/subscribe" style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#a78bfa", textDecoration: "none", border: "1px solid rgba(167,139,250,0.3)", padding: "3px 8px", borderRadius: 4 }}>Upgrade to Pro →</a>
    </div>
  );

  return (
    <div style={{ marginBottom: 8 }}>
      {!open ? (
        <button onClick={() => setOpen(true)}
          style={{ width: "100%", padding: "11px", borderRadius: 10, background: "none", border: "1px dashed var(--border2)", cursor: "none", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em", transition: "all 0.15s" }}>
          + ADD URL TO TRACK
        </button>
      ) : (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: "14px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border2)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em", marginBottom: 5 }}>URL *</div>
              <input ref={urlRef} type="text" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="https://competitor.com"
                style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 11px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 12 }} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em", marginBottom: 5 }}>LABEL</div>
              <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Top Competitor"
                style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 11px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 12 }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={() => setIsOwn(p => !p)}
              style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "none", padding: 0 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${isOwn ? "var(--accent)" : "var(--border2)"}`, background: isOwn ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                {isOwn && <span style={{ color: "#fff", fontSize: 9, lineHeight: 1 }}>✓</span>}
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text2)" }}>This is my own site</span>
            </button>
            <div style={{ display: "flex", gap: 7 }}>
              <button onClick={() => setOpen(false)} style={{ padding: "8px 14px", borderRadius: 6, background: "none", border: "1px solid var(--border)", cursor: "none", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>Cancel</button>
              <button onClick={submit} disabled={!url.trim()} className="btn-primary" style={{ padding: "8px 16px", borderRadius: 6, fontSize: 10, letterSpacing: "0.1em" }}>ADD & SCAN →</button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Leaderboard bar ─────────────────────────────────────────────────────────
function Leaderboard({ sites }: { sites: TrackedSite[] }) {
  const ranked = [...sites].filter(s => s.result).sort((a, b) => b.result!.metrics.performanceScore - a.result!.metrics.performanceScore);
  if (!ranked.length) return <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted2)", padding: "12px 0" }}>No results yet — scan your sites</p>;
  const you = ranked.find(s => s.isOwn);
  const youRank = you ? ranked.indexOf(you) + 1 : null;

  return (
    <div>
      {youRank && youRank > 1 && (
        <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 7, background: "rgba(232,52,26,0.06)", border: "1px solid rgba(232,52,26,0.18)" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent)" }}>
            ⚠ You're ranked #{youRank} — {ranked[0].label} is ahead by {ranked[0].result!.metrics.performanceScore - you!.result!.metrics.performanceScore} points
          </span>
        </div>
      )}
      {ranked.map((s, i) => {
        const score = s.result!.metrics.performanceScore;
        const c = scoreColor(score);
        return (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < ranked.length - 1 ? "1px solid var(--border)" : "none" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 16, color: i === 0 ? "#f59e0b" : "var(--muted2)", width: 20, textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: s.isOwn ? "var(--text)" : "var(--text2)", fontWeight: s.isOwn ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                {s.isOwn && <span style={{ fontFamily: "var(--font-mono)", fontSize: 7, color: "var(--accent)", background: "rgba(232,52,26,0.1)", padding: "1px 4px", borderRadius: 2 }}>YOU</span>}
              </div>
              <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8, delay: i * 0.08 }}
                  style={{ height: "100%", background: c, boxShadow: s.isOwn ? `0 0 6px ${c}` : "none" }} />
              </div>
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: c, width: 36, textAlign: "right", flexShrink: 0 }}>{score}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [sites, setSites] = useState<TrackedSite[]>([
    { id: "demo", url: "test.com", label: "My Website", isOwn: true, result: null, history: [], loading: false, error: "" }
  ]);
  const [tab, setTab] = useState<Tab>("overview");
  const [smsPhone, setSmsPhone] = useState("");
  const [smsSaved, setSmsSaved] = useState(false);
  const planLimit = 4; // 1 own + 3 competitors on Pulse
  const competitors = sites.filter(s => !s.isOwn);
  const own = sites.find(s => s.isOwn);

  const scan = useCallback(async (id: string) => {
    setSites(prev => prev.map(s => s.id === id ? { ...s, loading: true, error: "" } : s));
    const site = sites.find(s => s.id === id);
    if (!site) return;
    try {
      const r = await fetchAudit(site.url);
      setSites(prev => prev.map(s => s.id === id ? {
        ...s, loading: false, result: r,
        history: [...s.history.slice(-11), { ts: r.timestamp, score: r.metrics.performanceScore }],
      } : s));
    } catch (e) {
      setSites(prev => prev.map(s => s.id === id ? { ...s, loading: false, error: e instanceof Error ? e.message : "Scan failed" } : s));
    }
  }, [sites]);

  function addSite(url: string, label: string, isOwn: boolean) {
    const id = `site-${Date.now()}`;
    setSites(prev => [...prev, { id, url, label, isOwn, result: null, history: [], loading: false, error: "" }]);
    setTimeout(() => scan(id), 80);
  }

  function removeSite(id: string) { setSites(prev => prev.filter(s => s.id !== id)); }
  function scanAll() { sites.forEach(s => scan(s.id)); }

  // kick off demo scan
  useEffect(() => { scan("demo"); }, []);

  const alerts = sites.flatMap(s => {
    if (!s.result) return [];
    const out = [];
    if (s.result.severity === "critical") out.push({ type: "critical" as const, site: s.label, msg: `Score ${s.result.metrics.performanceScore} — critical performance`, ts: s.result.timestamp });
    if (s.result.adLossPercent > 30) out.push({ type: "warn" as const, site: s.label, msg: `${s.result.adLossPercent}% estimated ad revenue loss`, ts: s.result.timestamp });
    if (s.result.metrics.lcp > 4000) out.push({ type: "warn" as const, site: s.label, msg: `LCP ${fmtMs(s.result.metrics.lcp)} — users are abandoning before page loads`, ts: s.result.timestamp });
    return out;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>

      {/* ── Nav ── */}
      <nav style={{ borderBottom: "1px solid var(--border)", background: "rgba(8,15,28,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 20px", height: 54, display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
            <svg width={20} height={20} viewBox="0 0 28 28" fill="none">
              <path d="M14 2L25.26 8.5V21.5L14 28L2.74 21.5V8.5L14 2Z" stroke="#e8341a" strokeWidth="1.5" fill="rgba(232,52,26,0.1)" />
              <path d="M14 7L20.93 11V19L14 23L7.07 19V11L14 7Z" fill="#e8341a" opacity="0.7" />
            </svg>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 17, color: "var(--text)", letterSpacing: "0.08em" }}>NEXUS</span>
          </a>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#a78bfa", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", padding: "2px 7px", borderRadius: 3, letterSpacing: "0.1em" }}>PULSE</span>

          {/* Tab nav */}
          <div style={{ display: "flex", gap: 0, marginLeft: 12 }}>
            {(["overview","sites","alerts","settings"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: "6px 14px", background: "none", border: "none", cursor: "none", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", color: tab === t ? "var(--text)" : "var(--muted)", textTransform: "uppercase", borderBottom: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`, transition: "all 0.15s", position: "relative" }}>
                {t}
                {t === "alerts" && alerts.length > 0 && (
                  <span style={{ position: "absolute", top: 2, right: 2, width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", display: "block" }} />
                )}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Scan all */}
          <button onClick={scanAll} disabled={sites.some(s => s.loading)} className="btn-primary"
            style={{ padding: "7px 14px", borderRadius: 7, fontSize: 10, letterSpacing: "0.12em" }}>
            {sites.some(s => s.loading) ? "SCANNING..." : "↺ SCAN ALL"}
          </button>

          {/* Alert indicator */}
          {alerts.length > 0 && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 100, background: "rgba(232,52,26,0.1)", border: "1px solid rgba(232,52,26,0.25)", cursor: "none" }}
              onClick={() => setTab("alerts")}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} className="animate-pulse" />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.1em" }}>{alerts.length}</span>
            </motion.div>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 20px" }}>
        <AnimatePresence mode="wait">

          {/* ── OVERVIEW tab ── */}
          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                {/* Your score card */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                  style={{ gridColumn: "span 1", padding: "20px", borderRadius: 12, background: "rgba(232,52,26,0.04)", border: "1px solid rgba(232,52,26,0.2)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 12 }}>YOUR SITE</p>
                  {own?.loading ? (
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>Scanning…</div>
                  ) : own?.result ? (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                        <ScoreRing score={own.result.metrics.performanceScore} size={72} />
                        <div>
                          <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text)", fontWeight: 600, marginBottom: 4 }}>{own.label}</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: { critical: "#e8341a", warning: "#f59e0b", ok: "#10b981" }[own.result.severity], letterSpacing: "0.1em" }}>{own.result.severity.toUpperCase()}</div>
                        </div>
                      </div>
                      {own.history.length > 1 && <Sparkline data={own.history.map(h => h.score)} color={scoreColor(own.result.metrics.performanceScore)} w={160} h={36} />}
                    </div>
                  ) : (
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted2)" }}>Awaiting first scan</div>
                  )}
                </motion.div>

                {/* Revenue leak */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                  style={{ padding: "20px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 12 }}>REVENUE LEAK</p>
                  {own?.result ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        { l: "Ad loss", v: `${own.result.adLossPercent}%`, c: own.result.adLossPercent > 30 ? "#e8341a" : "#f59e0b" },
                        { l: "Bounce spike", v: `+${own.result.bounceRateIncrease}%`, c: "#f59e0b" },
                        { l: "Annual leak", v: `£${Math.round(own.result.annualRevenueLoss / 1000)}k`, c: "var(--text)" },
                      ].map(item => (
                        <div key={item.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>{item.l}</span>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: 22, color: item.c, letterSpacing: "0.02em" }}>{item.v}</span>
                        </div>
                      ))}
                    </div>
                  ) : <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted2)" }}>Scan to calculate</div>}
                </motion.div>

                {/* Next scan */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                  style={{ padding: "20px", borderRadius: 12, background: "linear-gradient(135deg,rgba(167,139,250,0.07),rgba(167,139,250,0.02))", border: "1px solid rgba(167,139,250,0.22)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 12 }}>PULSE STATUS</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 8px #10b981" }} className="animate-pulse" />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#10b981", letterSpacing: "0.1em" }}>MONITORING ACTIVE</span>
                  </div>
                  {[
                    { l: "Next auto-scan", v: "6d 14h" },
                    { l: "Sites tracked", v: `${sites.length} / ${planLimit}` },
                    { l: "Alerts fired", v: `${alerts.length} this session` },
                    { l: "SMS alerts", v: smsPhone || "Not configured" },
                  ].map(item => (
                    <div key={item.l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(167,139,250,0.1)" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)" }}>{item.l}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text2)" }}>{item.v}</span>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Leaderboard */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ padding: "20px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.15em" }}>PERFORMANCE RANKINGS</p>
                  <button onClick={() => setTab("sites")} style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", background: "none", border: "1px solid rgba(232,52,26,0.25)", padding: "3px 8px", borderRadius: 4, cursor: "none" }}>Manage sites →</button>
                </div>
                <Leaderboard sites={sites} />
              </motion.div>

              {/* Alerts preview */}
              {alerts.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  style={{ padding: "18px 20px", borderRadius: 12, background: "rgba(232,52,26,0.04)", border: "1px solid rgba(232,52,26,0.2)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", letterSpacing: "0.15em" }}>⚠ {alerts.length} ACTIVE ALERT{alerts.length > 1 ? "S" : ""}</p>
                    <button onClick={() => setTab("alerts")} style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--accent)", background: "none", border: "1px solid rgba(232,52,26,0.25)", padding: "3px 8px", borderRadius: 4, cursor: "none" }}>View all →</button>
                  </div>
                  {alerts.slice(0, 2).map((a, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "7px 0", borderBottom: i < Math.min(alerts.length, 2) - 1 ? "1px solid rgba(232,52,26,0.1)" : "none" }}>
                      <span style={{ fontSize: 13, flexShrink: 0 }}>{a.type === "critical" ? "🔴" : "⚠️"}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: a.type === "critical" ? "var(--accent)" : "var(--warn)", letterSpacing: "0.08em", display: "block", marginBottom: 1 }}>{a.site}</span>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text2)" }}>{a.msg}</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── SITES tab ── */}
          {tab === "sites" && (
            <motion.div key="sites" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3vw,32px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 4 }}>TRACKED SITES</h2>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)" }}>{sites.length} / {planLimit} slots used · {competitors.length} competitor{competitors.length !== 1 ? "s" : ""} tracked</p>
                </div>
              </div>

              <AddSiteRow onAdd={addSite} disabled={sites.filter(s => !s.isOwn).length >= planLimit - 1} />

              {own && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 8 }}>YOUR SITE</p>
                  <SiteCard site={own} onScan={() => scan(own.id)} onRemove={() => removeSite(own.id)} />
                </div>
              )}

              {competitors.length > 0 && (
                <div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 8 }}>COMPETITORS</p>
                  {competitors.map(s => <SiteCard key={s.id} site={s} onScan={() => scan(s.id)} onRemove={() => removeSite(s.id)} />)}
                </div>
              )}
            </motion.div>
          )}

          {/* ── ALERTS tab ── */}
          {tab === "alerts" && (
            <motion.div key="alerts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3vw,32px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 20 }}>ALERTS</h2>

              {alerts.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: 12 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#10b981", letterSpacing: "0.05em", marginBottom: 8 }}>ALL CLEAR</p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted)" }}>No performance issues detected. We&apos;ll SMS you the moment something changes.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                  {alerts.map((a, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ padding: "14px 16px", borderRadius: 10, background: a.type === "critical" ? "rgba(232,52,26,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${a.type === "critical" ? "rgba(232,52,26,0.22)" : "rgba(245,158,11,0.22)"}`, display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{a.type === "critical" ? "🔴" : "⚠️"}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: a.type === "critical" ? "var(--accent)" : "var(--warn)", letterSpacing: "0.1em", marginBottom: 4 }}>{a.site}</div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>{a.msg}</div>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted2)", flexShrink: 0, marginTop: 2 }}>{new Date(a.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* SMS setup */}
              <div style={{ padding: "20px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 14 }}>SMS ALERT SETTINGS</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text2)", marginBottom: 14, lineHeight: 1.6 }}>
                  Receive an instant text when: your score drops more than 10 points, a competitor overtakes you, or severity becomes CRITICAL.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="tel" value={smsPhone} onChange={e => setSmsPhone(e.target.value)} placeholder="+44 7700 000000"
                    style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border2)", borderRadius: 8, padding: "11px 14px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 13 }} />
                  <button onClick={() => { if (smsPhone) setSmsSaved(true); }} className="btn-primary"
                    style={{ padding: "11px 18px", borderRadius: 8, fontSize: 10, letterSpacing: "0.12em", whiteSpace: "nowrap", background: smsSaved ? "#10b981" : undefined }}>
                    {smsSaved ? "✓ SAVED" : "SAVE NUMBER"}
                  </button>
                </div>
                {smsSaved && <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#10b981", marginTop: 8 }}>✓ SMS alerts active on {smsPhone}</p>}
              </div>
            </motion.div>
          )}

          {/* ── SETTINGS tab ── */}
          {tab === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px,3vw,32px)", color: "var(--text)", letterSpacing: "0.05em", marginBottom: 20 }}>SETTINGS</h2>

              <div style={{ display: "grid", gap: 14 }}>
                {/* Plan */}
                <div style={{ padding: "20px", borderRadius: 12, background: "linear-gradient(135deg,rgba(167,139,250,0.07),rgba(167,139,250,0.02))", border: "1px solid rgba(167,139,250,0.22)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 6 }}>CURRENT PLAN</p>
                      <p style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "#a78bfa", letterSpacing: "0.05em" }}>NEXUS PULSE</p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>£49/month · Renews in 21 days</p>
                    </div>
                    <a href="/subscribe" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#a78bfa", textDecoration: "none", border: "1px solid rgba(167,139,250,0.3)", padding: "8px 14px", borderRadius: 7, letterSpacing: "0.1em" }}>UPGRADE TO PRO →</a>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                    {[["Sites", `${sites.length} / ${planLimit}`], ["Scan freq", "Weekly"], ["Report", "Monthly PDF"]].map(([l, v]) => (
                      <div key={l} style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.12)" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", marginBottom: 4 }}>{l}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text2)" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notification preferences */}
                <div style={{ padding: "20px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 14 }}>NOTIFICATION PREFERENCES</p>
                  {[
                    { label: "Score drops > 10 points", desc: "SMS + email" },
                    { label: "Competitor overtakes you", desc: "SMS + email" },
                    { label: "Severity becomes CRITICAL", desc: "Immediate SMS" },
                    { label: "Monthly performance report", desc: "Email PDF" },
                    { label: "Weekly summary digest", desc: "Email" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text)" }}>{item.label}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", marginTop: 2 }}>{item.desc}</div>
                      </div>
                      <div style={{ width: 36, height: 20, borderRadius: 10, background: "var(--accent)", border: "none", cursor: "none", position: "relative" }}>
                        <div style={{ position: "absolute", right: 2, top: 2, width: 16, height: 16, borderRadius: "50%", background: "#fff" }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Danger zone */}
                <div style={{ padding: "20px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 14 }}>ACCOUNT</p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button style={{ padding: "9px 16px", borderRadius: 7, background: "none", border: "1px solid var(--border2)", cursor: "none", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em" }}>EXPORT DATA</button>
                    <button style={{ padding: "9px 16px", borderRadius: 7, background: "none", border: "1px solid rgba(232,52,26,0.3)", cursor: "none", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent)", letterSpacing: "0.1em" }}>CANCEL PLAN</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}