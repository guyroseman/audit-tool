// @ts-nocheck
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Lead {
  id: string;
  email: string;
  url: string;
  score: number | null;
  severity: string | null;
  ad_loss_percent: number | null;
  annual_revenue_loss: number | null;
  pain_point: string | null;
  revenue_potential: string | null;
  source: string | null;
  phone: string | null;
  q1: string | null;
  q2: string | null;
  q3: string | null;
  tier: string | null;
  status: "new" | "contacted" | "converted" | "spam";
  created_at: string;
}

type SortKey = "created_at" | "score" | "status" | "tier";
type FilterStatus = "all" | Lead["status"];

const ADMIN_PASSWORD = "@Nexusr3355";
const SESSION_KEY = "nexus_admin_authed";

const STATUS_COLORS: Record<string, string> = {
  new: "#22d3ee",
  contacted: "#f59e0b",
  converted: "#10b981",
  spam: "#ef4444",
};

const TIER_COLORS: Record<string, string> = {
  free: "#6888a8",
  pulse: "#a78bfa",
  scale: "#f59e0b",
};

const SEV_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#22d3ee",
  low: "#10b981",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}

function fmtMoney(v: number | null) {
  if (!v) return "—";
  return `£${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`;
}

function scoreColor(s: number | null) {
  if (s === null) return "#6888a8";
  if (s >= 80) return "#10b981";
  if (s >= 60) return "#f59e0b";
  return "#ef4444";
}

function toCSV(rows: Lead[]): string {
  const headers = ["ID", "Email", "URL", "Score", "Severity", "Ad Loss %", "Annual Rev Loss", "Pain Point", "Revenue Potential", "Source", "Phone", "Q1", "Q2", "Q3", "Tier", "Status", "Created At"];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(","), ...rows.map(r => [
    r.id, r.email, r.url, r.score, r.severity, r.ad_loss_percent, r.annual_revenue_loss,
    r.pain_point, r.revenue_potential, r.source, r.phone, r.q1, r.q2, r.q3,
    r.tier, r.status, r.created_at,
  ].map(escape).join(","))];
  return lines.join("\n");
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // ── Auth Check — password gate with sessionStorage persistence ──────────────
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
    setCheckingAuth(false);
  }, []);

  function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
      setPwInput("");
    }
  }

  // ── Fetch Leads ─────────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/leads");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setLeads(json.leads ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (authed) fetchLeads(); }, [authed, fetchLeads]);

  // ── Update Status ───────────────────────────────────────────────────────────
  async function updateStatus(id: string, status: Lead["status"]) {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      if (selectedLead?.id === id) setSelectedLead(prev => prev ? { ...prev, status } : null);
      showToast(`Status → ${status.toUpperCase()}`);
    } catch (e: unknown) {
      showToast("Update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  // ── Export CSV ──────────────────────────────────────────────────────────────
  function exportCSV() {
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast("CSV exported");
  }

  // ── Filter + Sort ───────────────────────────────────────────────────────────
  const filtered = leads
    .filter(l => {
      if (filterStatus !== "all" && l.status !== filterStatus) return false;
      if (filterTier !== "all" && l.tier !== filterTier) return false;
      if (search) {
        const q = search.toLowerCase();
        return (l.email?.toLowerCase().includes(q) || l.url?.toLowerCase().includes(q) || l.pain_point?.toLowerCase().includes(q));
      }
      return true;
    })
    .sort((a, b) => {
      let av: unknown = a[sortKey], bv: unknown = b[sortKey];
      if (sortKey === "score") { av = a.score ?? -1; bv = b.score ?? -1; }
      const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = {
    total: leads.length,
    newCount: leads.filter(l => l.status === "new").length,
    converted: leads.filter(l => l.status === "converted").length,
    scaleLeads: leads.filter(l => l.tier === "scale").length,
    avgScore: leads.length ? Math.round(leads.reduce((s, l) => s + (l.score ?? 0), 0) / leads.length) : 0,
  };

  // ── Loading / Auth Guard ────────────────────────────────────────────────────
  if (checkingAuth) {
    return (
      <div style={{ minHeight: "100vh", background: "#060d1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "monospace", color: "#6888a8", fontSize: 13 }}>...</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#060d1a", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ width: "100%", maxWidth: 360, background: "#0a1628", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 16, padding: 36, textAlign: "center" }}
        >
          <div style={{ fontSize: 28, marginBottom: 16 }}>⬡</div>
          <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.14em", marginBottom: 6 }}>NEXUS ADMIN</div>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6888a8", marginBottom: 28 }}>Lead Intelligence — restricted access</div>
          <form onSubmit={submitPassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="password"
              value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(false); }}
              placeholder="Enter password"
              autoFocus
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${pwError ? "#ef4444" : "rgba(167,139,250,0.25)"}`, borderRadius: 8, padding: "12px 14px", color: "#c9d8e8", fontFamily: "monospace", fontSize: 13, outline: "none", textAlign: "center", letterSpacing: "0.1em" }}
            />
            {pwError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontFamily: "monospace", fontSize: 10, color: "#ef4444" }}>
                INCORRECT PASSWORD
              </motion.div>
            )}
            <button type="submit" style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.35)", borderRadius: 8, padding: "12px", color: "#a78bfa", fontFamily: "monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer" }}>
              ENTER →
            </button>
          </form>
          <a href="/" style={{ display: "block", marginTop: 20, fontFamily: "monospace", fontSize: 10, color: "#6888a8", textDecoration: "none" }}>← Back to home</a>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg, #060d1a)", fontFamily: "var(--font-mono, monospace)", color: "#c9d8e8", padding: "0 0 80px" }}>
      {/* ── Header ── */}
      <div style={{ borderBottom: "1px solid rgba(167,139,250,0.15)", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/dashboard" style={{ color: "#6888a8", textDecoration: "none", fontSize: 11 }}>← Dashboard</a>
          <span style={{ color: "rgba(167,139,250,0.3)" }}>|</span>
          <span style={{ color: "#a78bfa", fontSize: 13, fontWeight: 700, letterSpacing: "0.12em" }}>LEAD INTELLIGENCE</span>
          <span style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 4, padding: "1px 7px", fontSize: 10, color: "#a78bfa" }}>ADMIN</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchLeads} style={{ ...btnStyle, background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.25)", color: "#22d3ee" }}>↺ REFRESH</button>
          <button onClick={exportCSV} style={{ ...btnStyle, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>↓ EXPORT CSV</button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div style={{ display: "flex", gap: 1, borderBottom: "1px solid rgba(167,139,250,0.1)", flexWrap: "wrap" }}>
        {[
          { label: "TOTAL LEADS", val: stats.total, color: "#c9d8e8" },
          { label: "NEW", val: stats.newCount, color: "#22d3ee" },
          { label: "CONVERTED", val: stats.converted, color: "#10b981" },
          { label: "SCALE TIER", val: stats.scaleLeads, color: "#f59e0b" },
          { label: "AVG SCORE", val: stats.avgScore, color: scoreColor(stats.avgScore) },
        ].map(s => (
          <div key={s.label} style={{ flex: "1 1 120px", padding: "16px 20px", borderRight: "1px solid rgba(167,139,250,0.08)" }}>
            <div style={{ fontSize: 9, color: "#6888a8", letterSpacing: "0.12em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ padding: "14px 28px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", borderBottom: "1px solid rgba(167,139,250,0.08)" }}>
        <input
          placeholder="Search email, URL, pain point..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: "1 1 220px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 6, padding: "7px 12px", color: "#c9d8e8", fontFamily: "var(--font-mono, monospace)", fontSize: 11, outline: "none" }}
        />
        <FilterPill label="ALL" active={filterStatus === "all"} onClick={() => setFilterStatus("all")} color="#6888a8" />
        <FilterPill label="NEW" active={filterStatus === "new"} onClick={() => setFilterStatus("new")} color="#22d3ee" />
        <FilterPill label="CONTACTED" active={filterStatus === "contacted"} onClick={() => setFilterStatus("contacted")} color="#f59e0b" />
        <FilterPill label="CONVERTED" active={filterStatus === "converted"} onClick={() => setFilterStatus("converted")} color="#10b981" />
        <FilterPill label="SPAM" active={filterStatus === "spam"} onClick={() => setFilterStatus("spam")} color="#ef4444" />
        <span style={{ color: "rgba(167,139,250,0.25)" }}>|</span>
        <FilterPill label="FREE" active={filterTier === "free"} onClick={() => setFilterTier(filterTier === "free" ? "all" : "free")} color="#6888a8" />
        <FilterPill label="PULSE" active={filterTier === "pulse"} onClick={() => setFilterTier(filterTier === "pulse" ? "all" : "pulse")} color="#a78bfa" />
        <FilterPill label="SCALE" active={filterTier === "scale"} onClick={() => setFilterTier(filterTier === "scale" ? "all" : "scale")} color="#f59e0b" />
        <span style={{ marginLeft: "auto", fontSize: 10, color: "#6888a8" }}>{filtered.length} / {leads.length} leads</span>
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: "auto", padding: "0 0 20px" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#6888a8", fontSize: 12 }}>LOADING LEADS...</div>
        ) : error ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>{error}</div>
            <div style={{ color: "#6888a8", fontSize: 10, marginBottom: 16 }}>Make sure the leads table exists in Supabase and SUPABASE_SERVICE_ROLE_KEY is set.</div>
            <button onClick={fetchLeads} style={{ ...btnStyle, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa" }}>RETRY</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#6888a8", fontSize: 12 }}>
            {leads.length === 0 ? "NO LEADS YET — they appear here as users submit the funnel" : "NO MATCHING LEADS"}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(167,139,250,0.15)" }}>
                {([
                  ["DATE", "created_at"],
                  ["EMAIL", null],
                  ["URL", null],
                  ["SCORE", "score"],
                  ["SEV", null],
                  ["TIER", "tier"],
                  ["PAIN", null],
                  ["REV LOSS", null],
                  ["SOURCE", null],
                  ["STATUS", "status"],
                  ["ACTIONS", null],
                ] as [string, SortKey | null][]).map(([col, key]) => (
                  <th
                    key={col}
                    onClick={() => key && (sortKey === key ? setSortDir(d => d === "asc" ? "desc" : "asc") : (setSortKey(key), setSortDir("desc")))}
                    style={{ padding: "8px 12px", textAlign: "left", color: key && sortKey === key ? "#a78bfa" : "#6888a8", fontSize: 9, letterSpacing: "0.1em", cursor: key ? "pointer" : "default", userSelect: "none", whiteSpace: "nowrap" }}
                  >
                    {col}{key && sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, i) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.015 }}
                  onClick={() => setSelectedLead(lead)}
                  style={{ borderBottom: "1px solid rgba(167,139,250,0.06)", cursor: "pointer", background: selectedLead?.id === lead.id ? "rgba(167,139,250,0.06)" : undefined }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(167,139,250,0.05)")}
                  onMouseLeave={e => (e.currentTarget.style.background = selectedLead?.id === lead.id ? "rgba(167,139,250,0.06)" : "")}
                >
                  <td style={{ padding: "9px 12px", color: "#9ab8d8", whiteSpace: "nowrap" }}>{fmtDate(lead.created_at)}</td>
                  <td style={{ padding: "9px 12px", color: "#c9d8e8", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.email}</td>
                  <td style={{ padding: "9px 12px", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <a href={lead.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: "#22d3ee", textDecoration: "none" }}>{lead.url?.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a>
                  </td>
                  <td style={{ padding: "9px 12px", color: scoreColor(lead.score), fontWeight: 700 }}>{lead.score ?? "—"}</td>
                  <td style={{ padding: "9px 12px" }}>
                    {lead.severity && <span style={{ background: `${SEV_COLORS[lead.severity] ?? "#6888a8"}22`, border: `1px solid ${SEV_COLORS[lead.severity] ?? "#6888a8"}55`, borderRadius: 3, padding: "1px 5px", color: SEV_COLORS[lead.severity] ?? "#6888a8", fontSize: 9, textTransform: "uppercase" }}>{lead.severity}</span>}
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    {lead.tier && <span style={{ background: `${TIER_COLORS[lead.tier] ?? "#6888a8"}22`, border: `1px solid ${TIER_COLORS[lead.tier] ?? "#6888a8"}55`, borderRadius: 3, padding: "1px 5px", color: TIER_COLORS[lead.tier] ?? "#6888a8", fontSize: 9, textTransform: "uppercase" }}>{lead.tier}</span>}
                  </td>
                  <td style={{ padding: "9px 12px", color: "#9ab8d8", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.pain_point ?? "—"}</td>
                  <td style={{ padding: "9px 12px", color: "#f59e0b", whiteSpace: "nowrap" }}>{fmtMoney(lead.annual_revenue_loss)}</td>
                  <td style={{ padding: "9px 12px", color: "#6888a8", fontSize: 10 }}>{lead.source ?? "—"}</td>
                  <td style={{ padding: "9px 12px" }}>
                    <StatusBadge status={lead.status} />
                  </td>
                  <td style={{ padding: "9px 12px" }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {(["contacted", "converted", "spam"] as Lead["status"][]).map(s => (
                        lead.status !== s && (
                          <button
                            key={s}
                            disabled={updatingId === lead.id}
                            onClick={() => updateStatus(lead.id, s)}
                            style={{ ...btnStyle, padding: "3px 6px", fontSize: 8, background: `${STATUS_COLORS[s]}15`, border: `1px solid ${STATUS_COLORS[s]}40`, color: STATUS_COLORS[s], opacity: updatingId === lead.id ? 0.5 : 1 }}
                          >
                            {s === "contacted" ? "✉" : s === "converted" ? "✓" : "✗"}
                          </button>
                        )
                      ))}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Lead Detail Drawer ── */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(6,13,26,0.7)", zIndex: 40 }}
            />
            <motion.div
              key="drawer"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 95vw)", background: "#0a1628", borderLeft: "1px solid rgba(167,139,250,0.2)", zIndex: 50, overflowY: "auto", padding: 28 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#6888a8", marginBottom: 4 }}>LEAD DETAIL</div>
                  <div style={{ fontSize: 13, color: "#c9d8e8", fontWeight: 700 }}>{selectedLead.email}</div>
                </div>
                <button onClick={() => setSelectedLead(null)} style={{ ...btnStyle, padding: "4px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(167,139,250,0.2)", color: "#6888a8" }}>✕</button>
              </div>

              {/* Status buttons */}
              <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
                {(["new", "contacted", "converted", "spam"] as Lead["status"][]).map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selectedLead.id, s)}
                    disabled={updatingId === selectedLead.id}
                    style={{ ...btnStyle, padding: "6px 12px", fontSize: 9, fontWeight: 700, background: selectedLead.status === s ? `${STATUS_COLORS[s]}25` : "rgba(255,255,255,0.03)", border: `1px solid ${selectedLead.status === s ? STATUS_COLORS[s] : "rgba(167,139,250,0.15)"}`, color: selectedLead.status === s ? STATUS_COLORS[s] : "#6888a8" }}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Fields */}
              {[
                ["URL", <a key="url" href={selectedLead.url} target="_blank" rel="noopener noreferrer" style={{ color: "#22d3ee" }}>{selectedLead.url}</a>],
                ["Score", <span key="sc" style={{ color: scoreColor(selectedLead.score), fontWeight: 700 }}>{selectedLead.score ?? "—"}</span>],
                ["Severity", selectedLead.severity ? <span key="sev" style={{ color: SEV_COLORS[selectedLead.severity] ?? "#6888a8", textTransform: "uppercase" }}>{selectedLead.severity}</span> : "—"],
                ["Tier", selectedLead.tier ? <span key="tier" style={{ color: TIER_COLORS[selectedLead.tier] ?? "#6888a8", textTransform: "uppercase" }}>{selectedLead.tier}</span> : "—"],
                ["Ad Loss %", selectedLead.ad_loss_percent ? `${selectedLead.ad_loss_percent}%` : "—"],
                ["Annual Rev Loss", fmtMoney(selectedLead.annual_revenue_loss)],
                ["Pain Point", selectedLead.pain_point ?? "—"],
                ["Revenue Potential", selectedLead.revenue_potential ?? "—"],
                ["Phone", selectedLead.phone ?? "—"],
                ["Source", selectedLead.source ?? "—"],
                ["Q1 (Goal)", selectedLead.q1 ?? "—"],
                ["Q2 (Pain)", selectedLead.q2 ?? "—"],
                ["Q3 (Revenue)", selectedLead.q3 ?? "—"],
                ["Submitted", fmtDate(selectedLead.created_at)],
              ].map(([label, val]) => (
                <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(167,139,250,0.07)", gap: 12 }}>
                  <span style={{ fontSize: 10, color: "#6888a8", flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 11, color: "#c9d8e8", textAlign: "right", wordBreak: "break-all" }}>{val}</span>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.35)", borderRadius: 8, padding: "10px 20px", fontSize: 11, color: "#c9d8e8", zIndex: 100, pointerEvents: "none" }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Lead["status"] }) {
  const c = STATUS_COLORS[status] ?? "#6888a8";
  return (
    <span style={{ background: `${c}20`, border: `1px solid ${c}50`, borderRadius: 3, padding: "2px 6px", color: c, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>{status}</span>
  );
}

function FilterPill({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      style={{ background: active ? `${color}20` : "transparent", border: `1px solid ${active ? color : "rgba(167,139,250,0.15)"}`, borderRadius: 4, padding: "4px 10px", color: active ? color : "#6888a8", fontFamily: "var(--font-mono, monospace)", fontSize: 9, cursor: "pointer", letterSpacing: "0.08em", transition: "all 0.15s" }}
    >
      {label}
    </button>
  );
}

const btnStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono, monospace)",
  fontSize: 10,
  letterSpacing: "0.08em",
  cursor: "pointer",
  borderRadius: 5,
  padding: "6px 12px",
  border: "none",
  transition: "all 0.15s",
};
