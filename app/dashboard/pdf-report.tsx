// @ts-nocheck
import { Document, Page, Text, View, StyleSheet, Svg, Circle } from "@react-pdf/renderer";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sc(score) {
  if (score < 50) return "#e8341a";
  if (score < 80) return "#f59e0b";
  return "#10b981";
}
function fmtMs(ms) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page:        { backgroundColor: "#ffffff", fontFamily: "Helvetica", fontSize: 10, color: "#111827" },
  // Header
  header:      { backgroundColor: "#030712", padding: "20 28 18 28", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft:  { flexDirection: "column", gap: 3 },
  headerTitle: { fontSize: 9, color: "#6b7280", letterSpacing: 2, fontFamily: "Helvetica" },
  headerDomain:{ fontSize: 20, color: "#ffffff", fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  headerMeta:  { fontSize: 8, color: "#4b5563", marginTop: 2 },
  planBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, alignSelf: "flex-start" },
  // Body
  body:        { padding: "22 28 24 28" },
  section:     { marginBottom: 18 },
  sectionLabel:{ fontSize: 7, letterSpacing: 2, color: "#9ca3af", marginBottom: 10, fontFamily: "Helvetica-Bold" },
  // Score ring card
  scoresRow:   { flexDirection: "row", gap: 10, marginBottom: 18 },
  scoreCard:   { flex: 1, backgroundColor: "#f9fafb", borderRadius: 8, padding: "14 10 12 10", alignItems: "center" },
  scoreLabel:  { fontSize: 6.5, letterSpacing: 1, color: "#6b7280", marginTop: 6, textAlign: "center", fontFamily: "Helvetica-Bold" },
  // Revenue card
  revCard:     { backgroundColor: "#030712", borderRadius: 8, padding: "14 18", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  revAmount:   { fontSize: 28, fontFamily: "Helvetica-Bold", color: "#e8341a" },
  revLabel:    { fontSize: 7, color: "#9ca3af", letterSpacing: 1.5, marginBottom: 3, fontFamily: "Helvetica-Bold" },
  revSub:      { fontSize: 9, color: "#4b5563", marginTop: 3 },
  sevBadge:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4 },
  // Revenue breakdown
  statsRow:    { flexDirection: "row", gap: 10, marginBottom: 18 },
  statBox:     { flex: 1, backgroundColor: "#f9fafb", borderRadius: 6, padding: "10 12" },
  statLabel:   { fontSize: 6.5, letterSpacing: 1.5, color: "#9ca3af", marginBottom: 4, fontFamily: "Helvetica-Bold" },
  statValue:   { fontSize: 16, fontFamily: "Helvetica-Bold" },
  // Tasks
  taskItem:    { marginBottom: 10, padding: "11 13", backgroundColor: "#f9fafb", borderRadius: 7 },
  taskHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  taskTitle:   { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#111827", flex: 1 },
  taskMeta:    { flexDirection: "row", gap: 6, alignItems: "center" },
  taskBadge:   { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, fontSize: 7, fontFamily: "Helvetica-Bold" },
  taskDesc:    { fontSize: 9, color: "#4b5563", lineHeight: 1.5 },
  // Tech health
  techRow:     { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  techItem:    { flexDirection: "row", gap: 5, alignItems: "center", width: "47%", marginBottom: 4 },
  techDot:     { width: 6, height: 6, borderRadius: 3, marginTop: 1 },
  techText:    { fontSize: 8.5, color: "#374151" },
  // Competitors
  compRow:     { flexDirection: "row", gap: 8, marginBottom: 8 },
  compCard:    { flex: 1, backgroundColor: "#f9fafb", borderRadius: 6, padding: "10 12" },
  compLabel:   { fontSize: 7, color: "#6b7280", letterSpacing: 1, marginBottom: 6, fontFamily: "Helvetica-Bold" },
  compMetric:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  compMetLabel:{ fontSize: 8, color: "#6b7280" },
  // Divider
  divider:     { height: 1, backgroundColor: "#e5e7eb", marginBottom: 16 },
  // Footer
  footer:      { backgroundColor: "#f9fafb", padding: "10 28", flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  footerText:  { fontSize: 7.5, color: "#9ca3af" },
});

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, label }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const gap = circ - fill;
  const offset = circ / 4; // start from 12 o'clock
  const color = sc(score);

  return (
    <View style={S.scoreCard}>
      <View style={{ position: "relative", width: 52, height: 52 }}>
        <Svg width={52} height={52} viewBox="0 0 52 52">
          <Circle cx={26} cy={26} r={r} fill="none" stroke="#e5e7eb" strokeWidth={3.5} />
          <Circle
            cx={26} cy={26} r={r}
            fill="none"
            stroke={color}
            strokeWidth={3.5}
            strokeDasharray={`${fill} ${gap}`}
            strokeDashoffset={String(offset)}
            strokeLinecap="round"
          />
        </Svg>
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 15, color }}>{score}</Text>
        </View>
      </View>
      <Text style={S.scoreLabel}>{label}</Text>
    </View>
  );
}

// ─── Severity ─────────────────────────────────────────────────────────────────
const SEV_COLOR = { critical: "#e8341a", warning: "#f59e0b", ok: "#10b981" };
const SEV_BG    = { critical: "rgba(232,52,26,0.1)", warning: "rgba(245,158,11,0.1)", ok: "rgba(16,185,129,0.1)" };

// ─── Pillar icon text ─────────────────────────────────────────────────────────
const PILLAR = {
  performance:   { label: "Performance",   icon: "⚡", color: "#e8341a" },
  seo:           { label: "SEO",           icon: "🔍", color: "#f59e0b" },
  security:      { label: "Security",      icon: "🔒", color: "#3b82f6" },
  accessibility: { label: "Accessibility", icon: "♿", color: "#a78bfa" },
};

// ─── Main PDF Document ───────────────────────────────────────────────────────
export function AuditPDF({ own, competitors, plan }) {
  const r = own.result;
  if (!r) return <Document><Page size="A4"><Text>No audit data.</Text></Page></Document>;

  const domain = own.url.replace(/https?:\/\//, "").replace(/\/.*/, "");
  const date = new Date(r.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const isScale = plan === "scale";

  const pendingTasks = (own.tasks || []).filter(t => t.status !== "recovered").slice(0, 7);
  const techChecks = [
    { label: "Browser Caching",       pass: !r.tech.noBrowserCache },
    { label: "Text Compression",      pass: !r.tech.noCompression },
    { label: "Image Optimisation",    pass: !r.tech.noImageOptimisation },
    { label: "Render-Blocking JS/CSS",pass: !r.tech.renderBlockingResources },
    { label: "Unused JavaScript",     pass: !r.tech.unusedJavascript },
  ];
  const techPassing = techChecks.filter(c => c.pass).length;

  const sev = r.severity;
  const comps = (competitors || []).filter(c => c.result);

  return (
    <Document title={`Nexus Audit — ${domain}`} author="Nexus Diagnostics">
      <Page size="A4" style={S.page}>

        {/* ── Header ── */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            {!isScale && <Text style={S.headerTitle}>NEXUS DIAGNOSTICS</Text>}
            <Text style={S.headerDomain}>{domain}</Text>
            <Text style={S.headerMeta}>4-Pillar Digital Audit Report  ·  {date}</Text>
          </View>
          <View style={[S.planBadge, { backgroundColor: isScale ? "rgba(232,52,26,0.2)" : "rgba(167,139,250,0.2)" }]}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: isScale ? "#e8341a" : "#a78bfa", letterSpacing: 1 }}>
              {plan.toUpperCase()} PLAN
            </Text>
          </View>
        </View>

        <View style={S.body}>

          {/* ── 4 Score Rings ── */}
          <Text style={S.sectionLabel}>DIGITAL HEALTH SCORES</Text>
          <View style={S.scoresRow}>
            <ScoreRing score={r.metrics.performanceScore} label="PERFORMANCE" />
            <ScoreRing score={r.seo?.estimatedSeoScore ?? 0}           label="SEO" />
            <ScoreRing score={r.accessibility?.estimatedA11yScore ?? 0} label="ACCESSIBILITY" />
            <ScoreRing score={r.security?.estimatedBestPracticesScore ?? 0} label="SECURITY" />
          </View>

          {/* ── Revenue Leak Card ── */}
          <View style={S.revCard}>
            <View>
              <Text style={S.revLabel}>MONTHLY REVENUE LEAK</Text>
              <Text style={S.revAmount}>${r.totalMonthlyCost.toLocaleString()}/mo</Text>
              <Text style={S.revSub}>${Math.round(r.totalMonthlyCost * 12).toLocaleString()}/yr annualised</Text>
            </View>
            <View style={[S.sevBadge, { backgroundColor: SEV_BG[sev] }]}>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: SEV_COLOR[sev], letterSpacing: 1 }}>
                {sev.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* ── Revenue Breakdown ── */}
          <View style={S.statsRow}>
            {[
              { label: "AD WASTE",         value: `$${r.monthlyAdOverspend.toLocaleString()}/mo`,    color: "#f59e0b" },
              { label: "SEO REVENUE LOSS", value: `$${r.monthlyOrganicLoss.toLocaleString()}/mo`,    color: "#f59e0b" },
              { label: "AD EFFICIENCY GAP",value: `${r.adLossPercent}%`,                             color: sc(100 - r.adLossPercent) },
              { label: "MARKET LOCKOUT",   value: `${r.accessibility?.estimatedMarketLockout ?? 0}%`, color: sc(100 - (r.accessibility?.estimatedMarketLockout ?? 0)) },
            ].map(item => (
              <View key={item.label} style={S.statBox}>
                <Text style={S.statLabel}>{item.label}</Text>
                <Text style={[S.statValue, { color: item.color }]}>{item.value}</Text>
              </View>
            ))}
          </View>

          <View style={S.divider} />

          {/* ── Action Plan ── */}
          {pendingTasks.length > 0 && (
            <View style={S.section}>
              <Text style={S.sectionLabel}>ACTION PLAN — {pendingTasks.length} ITEMS</Text>
              {pendingTasks.map((task, i) => {
                const pm = PILLAR[task.pillar] ?? PILLAR.performance;
                const impColor = task.impact === "High" ? "#e8341a" : task.impact === "Medium" ? "#f59e0b" : "#6b7280";
                return (
                  <View key={task.id} style={[S.taskItem, { borderLeftWidth: 3, borderLeftColor: pm.color }]}>
                    <View style={S.taskHeader}>
                      <Text style={S.taskTitle}>{task.title}</Text>
                      <View style={S.taskMeta}>
                        {task.val > 0 && (
                          <View style={[S.taskBadge, { backgroundColor: "rgba(16,185,129,0.1)" }]}>
                            <Text style={{ color: "#10b981", fontSize: 7 }}>~${task.val}k/yr</Text>
                          </View>
                        )}
                        <View style={[S.taskBadge, { backgroundColor: `${impColor}15` }]}>
                          <Text style={{ color: impColor, fontSize: 7 }}>{task.impact} Impact</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={S.taskDesc}>{task.desc}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={S.divider} />

          {/* ── Technical Health ── */}
          <View style={S.section} wrap={false}>
            <Text style={S.sectionLabel}>TECHNICAL HEALTH — {techPassing}/{techChecks.length} PASSING</Text>
            <View style={S.techRow}>
              {techChecks.map(c => (
                <View key={c.label} style={S.techItem}>
                  <View style={[S.techDot, { backgroundColor: c.pass ? "#10b981" : "#e8341a" }]} />
                  <Text style={S.techText}>{c.label}</Text>
                </View>
              ))}
              {r.tech.thirdPartyImpact > 400 && (
                <View style={S.techItem}>
                  <View style={[S.techDot, { backgroundColor: "#f59e0b" }]} />
                  <Text style={S.techText}>3rd-party impact: {fmtMs(r.tech.thirdPartyImpact)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Competitors ── */}
          {comps.length > 0 && (
            <View wrap={false}>
              <View style={S.divider} />
              <View style={S.section}>
                <Text style={S.sectionLabel}>COMPETITOR COMPARISON</Text>
                {comps.map(c => (
                  <View key={c.id} style={S.compRow}>
                    <View style={[S.compCard, { flex: 0.8 }]}>
                      <Text style={S.compLabel}>{c.label}</Text>
                      {[
                        { label: "Performance", you: r.metrics.performanceScore, them: c.result.metrics.performanceScore },
                        { label: "SEO",         you: r.seo?.estimatedSeoScore ?? 0, them: c.result.seo?.estimatedSeoScore ?? 0 },
                        { label: "Security",    you: r.security?.estimatedBestPracticesScore ?? 0, them: c.result.security?.estimatedBestPracticesScore ?? 0 },
                      ].map(m => {
                        const win = m.you >= m.them;
                        return (
                          <View key={m.label} style={S.compMetric}>
                            <Text style={S.compMetLabel}>{m.label}</Text>
                            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: win ? "#10b981" : "#e8341a" }}>
                              You {m.you} vs {m.them}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

        </View>

        {/* ── Footer ── */}
        <View style={S.footer} fixed>
          {!isScale
            ? <Text style={S.footerText}>Generated by NEXUS DIAGNOSTICS — nexus-diagnostics.com</Text>
            : <Text style={S.footerText}>{domain} — Audit Report</Text>
          }
          <Text style={S.footerText}>{date}</Text>
        </View>

      </Page>
    </Document>
  );
}
