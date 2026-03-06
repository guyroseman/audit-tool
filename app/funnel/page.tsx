"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAudit, fmtMs, scoreColor, metricStatus } from "../lib/audit";
import type { AuditResult } from "../lib/audit";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = "q1" | "q2" | "q3" | "url" | "loading" | "email" | "report" | "phone" | "booked";

interface FunnelData {
  q1?: string; q2?: string; q3?: string;
  url?: string; email?: string; phone?: string;
}

// ─── Progress dots ────────────────────────────────────────────────────────────
const SURVEY_STEPS = ["q1","q2","q3","url"];
function ProgressDots({ step }: { step: Step }) {
  const idx = SURVEY_STEPS.indexOf(step);
  if (idx === -1) return null;
  return (
    <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:32 }}>
      {SURVEY_STEPS.map((_,i) => (
        <motion.div key={i}
          animate={{ width: i===idx ? 24 : 6, background: i<=idx ? "#e8341a" : "#0e1e35" }}
          style={{ height:6, borderRadius:3 }} transition={{ duration:0.3 }} />
      ))}
    </div>
  );
}

// ─── Question wrapper ─────────────────────────────────────────────────────────
function Q({ question, sub, children }: { question: string; sub?: string; children: React.ReactNode }) {
  return (
    <motion.div key={question} initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, y:-16 }} transition={{ duration:0.35, ease:[0.16,1,0.3,1] }}
      style={{ width:"100%", maxWidth:520, margin:"0 auto" }}>
      <div style={{ marginBottom:28, textAlign:"center" }}>
        <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(28px,6vw,44px)", color:"var(--text)", letterSpacing:"0.03em", lineHeight:1.05, marginBottom:10 }}>
          {question}
        </h2>
        {sub && <p style={{ fontFamily:"var(--font-body)", fontSize:14, color:"var(--text2)", lineHeight:1.6 }}>{sub}</p>}
      </div>
      {children}
    </motion.div>
  );
}

// ─── Choice tile — auto-advances on click ─────────────────────────────────────
function Choice({ label, sub, icon, onClick }: { label:string; sub?:string; icon:string; onClick:()=>void }) {
  const [flash, setFlash] = useState(false);
  function handle() {
    setFlash(true);
    setTimeout(onClick, 220);
  }
  return (
    <motion.button onClick={handle} whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
      style={{ width:"100%", textAlign:"left", padding:"16px 20px", marginBottom:10, borderRadius:12,
        background: flash ? "rgba(232,52,26,0.12)" : "var(--surface)",
        border: `1px solid ${flash ? "#e8341a" : "var(--border)"}`,
        boxShadow: flash ? "0 0 20px rgba(232,52,26,0.18)" : "none",
        cursor:"none", transition:"background 0.15s, border-color 0.15s, box-shadow 0.15s",
        display:"flex", alignItems:"center", gap:14 }}>
      <span style={{ fontSize:22, lineHeight:1, flexShrink:0 }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"var(--font-body)", fontWeight:500, fontSize:15, color: flash ? "#e8341a" : "var(--text)", transition:"color 0.15s" }}>{label}</div>
        {sub && <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", marginTop:2 }}>{sub}</div>}
      </div>
      <motion.span animate={{ x: flash ? 4 : 0 }} style={{ color:"var(--muted)", fontSize:14 }}>→</motion.span>
    </motion.button>
  );
}

// ─── Terminal loader ──────────────────────────────────────────────────────────
const SCAN_LINES = [
  "> Connecting to target host...",
  "> Downloading HTML payload...",
  "> Parsing render-blocking resources...",
  "> Measuring Largest Contentful Paint...",
  "> Calculating Total Blocking Time...",
  "> Running revenue impact model...",
  "> Compiling your diagnostic...",
];
function Loader({ url }: { url:string }) {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    let i=0;
    const t = setInterval(()=>{ if(i<SCAN_LINES.length){setLines(p=>[...p,SCAN_LINES[i]]);i++;}else clearInterval(t); },320);
    return ()=>clearInterval(t);
  },[]);
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ width:"100%", maxWidth:480, margin:"0 auto", textAlign:"center" }}>
      <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--accent)", letterSpacing:"0.2em", marginBottom:8 }}>SCANNING</p>
      <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(22px,4vw,34px)", color:"var(--text)", letterSpacing:"0.04em", marginBottom:24 }}>
        {url.replace(/https?:\/\//,"").replace(/\/$/,"")}
      </h2>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"18px 20px", fontFamily:"var(--font-mono)", fontSize:12, textAlign:"left", minHeight:200 }}>
        <div style={{ display:"flex", gap:6, marginBottom:14, paddingBottom:12, borderBottom:"1px solid var(--border)" }}>
          {["#e8341a","#f59e0b","#10b981"].map(c=><span key={c} style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>)}
          <span style={{ marginLeft:6, color:"var(--muted2)", fontSize:10 }}>audit-engine v3</span>
        </div>
        {lines.map((l,i)=>(
          <motion.div key={i} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{duration:0.15}}
            style={{ color: i===lines.length-1 ? "var(--text)" : "var(--muted)", marginBottom:5 }}>{l}</motion.div>
        ))}
        {lines.length < SCAN_LINES.length && <span style={{ color:"var(--accent)", animation:"blink 1s step-end infinite" }}>█</span>}
      </div>
      <div style={{ marginTop:14, height:2, background:"var(--border)", borderRadius:2, overflow:"hidden" }}>
        <motion.div style={{ height:"100%", background:"var(--accent)", boxShadow:"0 0 8px var(--accent-glow)" }}
          initial={{ width:0 }} animate={{ width:`${(lines.length/SCAN_LINES.length)*100}%` }} transition={{ duration:0.35 }} />
      </div>
    </motion.div>
  );
}

// ─── Score gauge ──────────────────────────────────────────────────────────────
function Gauge({ score, animated }: { score:number; animated:boolean }) {
  const r=68, circ=2*Math.PI*r;
  const color=scoreColor(score);
  const [disp,setDisp]=useState(0);
  useEffect(()=>{
    if(!animated){setDisp(score);return;}
    let raf:number;
    const t0=performance.now(), dur=2000;
    function tick(now:number){
      const p=Math.min((now-t0)/dur,1), e=1-Math.pow(1-p,3);
      setDisp(Math.round(e*score));
      if(p<1) raf=requestAnimationFrame(tick);
    }
    raf=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf);
  },[score,animated]);
  return (
    <div style={{ position:"relative", width:160, height:160, flexShrink:0 }}>
      <svg width={160} height={160} style={{ transform:"rotate(-90deg)" }} viewBox="0 0 160 160">
        <circle cx={80} cy={80} r={r} fill="none" stroke="var(--border)" strokeWidth={8}/>
        <circle cx={80} cy={80} r={r} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={animated ? circ-(score/100)*circ : circ}
          className="gauge-progress" style={{ filter:`drop-shadow(0 0 8px ${color})` }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontFamily:"var(--font-display)", fontSize:46, color, textShadow:`0 0 20px ${color}`, lineHeight:1, letterSpacing:"0.02em" }}>{disp}</span>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", letterSpacing:"0.15em", marginTop:2 }}>SCORE</span>
      </div>
    </div>
  );
}

// ─── Metric row ───────────────────────────────────────────────────────────────
function MetricRow({ label, value, formatted, thresholds }: { label:string; value:number; formatted:string; thresholds:[number,number] }) {
  const s=metricStatus(value,thresholds);
  const c={ok:"#10b981",warn:"#f59e0b",bad:"#e8341a"}[s];
  const l={ok:"PASS",warn:"SLOW",bad:"FAIL"}[s];
  const pct=s==="ok"?100:s==="warn"?55:22;
  return (
    <div style={{ padding:"12px 0", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", marginBottom:5 }}>{label}</div>
        <div style={{ height:2, background:"var(--border)", borderRadius:2, overflow:"hidden" }}>
          <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:1, delay:0.2 }}
            style={{ height:"100%", background:c, boxShadow:`0 0 6px ${c}` }}/>
        </div>
      </div>
      <div style={{ textAlign:"right", minWidth:90 }}>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:14, color:"var(--text)", fontWeight:500 }}>{formatted}</span>
        <span style={{ display:"block", fontFamily:"var(--font-mono)", fontSize:9, color:c, letterSpacing:"0.12em", marginTop:1 }}>{l}</span>
      </div>
    </div>
  );
}

// ─── Post-result micro survey (emotional investment) ──────────────────────────
function ResultSurvey({ result, onDone }: { result:AuditResult; onDone:(ans:string)=>void }) {
  const score = result.metrics.performanceScore;
  const q = score < 50
    ? "When you see these numbers — what's your honest reaction?"
    : "Your site has issues but they're fixable. What matters most to you right now?";
  const choices = score < 50 ? [
    { icon:"😤", label:"Honestly frustrated — I had no idea it was this bad", val:"frustrated" },
    { icon:"💸", label:"Worried about the money I've been losing", val:"money" },
    { icon:"🏃", label:"Ready to fix it — what do I do first?", val:"ready" },
    { icon:"🤷", label:"Not sure where to start", val:"unsure" },
  ] : [
    { icon:"📈", label:"Getting more leads from my existing traffic", val:"leads" },
    { icon:"⚡", label:"Making the site noticeably faster", val:"speed" },
    { icon:"💰", label:"Reducing what I spend on ads", val:"ads" },
    { icon:"🤖", label:"Automating follow-up so I stop missing leads", val:"automation" },
  ];
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
      style={{ maxWidth:520, margin:"0 auto", paddingTop:8 }}>
      <p style={{ fontFamily:"var(--font-display)", fontSize:"clamp(20px,4vw,28px)", color:"var(--text)", letterSpacing:"0.04em", textAlign:"center", marginBottom:20, lineHeight:1.15 }}>{q}</p>
      {choices.map(c=>(
        <Choice key={c.val} label={c.label} icon={c.icon} onClick={()=>onDone(c.val)} />
      ))}
    </motion.div>
  );
}

// ─── Service cards (non-pushy, curiosity-first) ───────────────────────────────
const SERVICES = [
  {
    id:"speed", icon:"⚡", title:"Site Speed Rebuild",
    tagline:"Load in under 1.5s. Or we work for free.",
    desc:"We fetch your site, rebuild it on our stack, and target a sub-1.5s load time. Most clients see bounce rate drop 40–60% within the first week.",
    proof:"Takes 3–5 days. Fixed price from £1,200.",
    cta:"Tell me more about this",
  },
  {
    id:"ai", icon:"🤖", title:"AI Lead Response Agent",
    tagline:"Respond to every lead in under 90 seconds. 24/7.",
    desc:"The average business responds to web leads in 47 hours. Our AI agent responds instantly, qualifies the prospect, and books a call — while you sleep.",
    proof:"Setup in 48hrs. From £350/mo.",
    cta:"I want to see how this works",
  },
  {
    id:"leads", icon:"🎯", title:"Weekly Pre-Qualified Leads",
    tagline:"Stop waiting for traffic. Buy intent.",
    desc:"We have a pool of verified, opted-in prospects in your vertical actively looking for services like yours. Delivered to your inbox every Monday.",
    proof:"15–40 leads/week typical. From £600/mo.",
    cta:"Show me the lead pool",
  },
  {
    id:"calls", icon:"📞", title:"White-Label Sales Team",
    tagline:"We call, qualify, and close. In your name.",
    desc:"Our trained team works your leads white-label — calling in your brand name, handling objections, and booking appointments directly in your calendar.",
    proof:"Pay per booked appointment. No retainer.",
    cta:"Explain how this works",
  },
];

function ServiceCard({ svc, expanded, onExpand, onCTA }: {
  svc:typeof SERVICES[0]; expanded:boolean; onExpand:()=>void; onCTA:()=>void;
}) {
  return (
    <motion.div layout style={{ borderRadius:12, overflow:"hidden",
      background: expanded ? "rgba(232,52,26,0.04)" : "var(--surface)",
      border: `1px solid ${expanded ? "rgba(232,52,26,0.3)" : "var(--border)"}`,
      marginBottom:10, transition:"border-color 0.2s, background 0.2s" }}>
      <button onClick={onExpand} style={{ width:"100%", padding:"18px 20px", display:"flex", alignItems:"center", gap:14, background:"none", border:"none", cursor:"none", textAlign:"left" }}>
        <span style={{ fontSize:20, flexShrink:0 }}>{svc.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"var(--font-body)", fontWeight:600, fontSize:15, color:"var(--text)", marginBottom:2 }}>{svc.title}</div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)" }}>{svc.tagline}</div>
        </div>
        <motion.span animate={{ rotate: expanded ? 180:0 }} style={{ color:"var(--muted)", fontSize:12, flexShrink:0 }}>▼</motion.span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.28, ease:[0.16,1,0.3,1] }}
            style={{ overflow:"hidden" }}>
            <div style={{ padding:"0 20px 20px" }}>
              <div style={{ height:1, background:"var(--border)", marginBottom:14 }}/>
              <p style={{ fontFamily:"var(--font-body)", fontSize:14, color:"var(--text2)", lineHeight:1.65, marginBottom:12 }}>{svc.desc}</p>
              <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--accent)", marginBottom:16 }}>{svc.proof}</p>
              <button onClick={onCTA} style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--accent)", background:"none", border:"1px solid rgba(232,52,26,0.35)", borderRadius:6, padding:"10px 18px", cursor:"none", letterSpacing:"0.1em", transition:"background 0.15s", width:"100%", textAlign:"center" }}
                onMouseEnter={e=>(e.currentTarget.style.background="rgba(232,52,26,0.08)") }
                onMouseLeave={e=>(e.currentTarget.style.background="none") }>
                {svc.cta} →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Phone capture ────────────────────────────────────────────────────────────
function PhoneCapture({ result, surveyAns, onDone }: {
  result: AuditResult; surveyAns: string; onDone:(phone:string)=>void;
}) {
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(()=>{ ref.current?.focus(); },[]);

  const score = result.metrics.performanceScore;
  const loss = Math.round(result.annualRevenueLoss / 1000);

  const ctaByAns: Record<string,string> = {
    frustrated: "You shouldn't have to figure this out alone.",
    money: `Let's stop that £${loss}k leak together.`,
    ready: "Good. Let's get you a plan in the next 15 minutes.",
    unsure: "A quick call is the fastest way to get clarity.",
    leads: "We'll show you exactly how many leads you're leaving behind.",
    speed: "We'll tell you exactly what's slowing you down and how to fix it.",
    ads: "We can show you how to get more from your current ad spend.",
    automation: "Our AI agent setup takes 48 hours. Let's talk.",
  };

  const headline = ctaByAns[surveyAns] ?? "A 15-minute call changes everything.";

  async function submit() {
    const t = phone.replace(/\s/g,"");
    if (t.length < 8) { setErr("Enter a valid phone number."); return; }
    setLoading(true);
    await new Promise(r=>setTimeout(r,600));
    setLoading(false);
    onDone(phone);
  }

  return (
    <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
      style={{ maxWidth:460, margin:"0 auto", textAlign:"center" }}>
      {/* Score badge */}
      <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay:0.1 }}
        style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"10px 20px", borderRadius:100, background:"rgba(232,52,26,0.08)", border:"1px solid rgba(232,52,26,0.25)", marginBottom:24 }}>
        <span style={{ fontFamily:"var(--font-display)", fontSize:28, color:"var(--accent)", lineHeight:1, letterSpacing:"0.02em" }}>{score}</span>
        <div style={{ textAlign:"left" }}>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--accent)", letterSpacing:"0.15em" }}>YOUR SCORE</div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)" }}>{score<50?"CRITICAL":score<80?"NEEDS WORK":"GOOD"}</div>
        </div>
      </motion.div>

      <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(26px,5vw,40px)", color:"var(--text)", letterSpacing:"0.03em", lineHeight:1.1, marginBottom:12 }}>
        {headline}
      </h2>
      <p style={{ fontFamily:"var(--font-body)", fontSize:14, color:"var(--text2)", lineHeight:1.65, marginBottom:28 }}>
        Drop your number. One of our team will call you within <strong style={{ color:"var(--text)" }}>2 hours</strong> — no pitch, just a straight conversation about your site and what's worth fixing first.
      </p>

      {/* Trust signals */}
      <div style={{ display:"flex", justifyContent:"center", gap:20, marginBottom:28 }}>
        {[["🔒","No spam"],["⏱","2hr callback"],["🆓","No charge"]].map(([i,l])=>(
          <div key={l} style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", display:"flex", alignItems:"center", gap:5 }}>
            <span>{i}</span><span>{l}</span>
          </div>
        ))}
      </div>

      <input ref={ref} type="tel" value={phone} placeholder="+44 7700 000000"
        onChange={e=>setPhone(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
        style={{ width:"100%", background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:10, padding:"16px 18px", color:"var(--text)", fontFamily:"var(--font-mono)", fontSize:16, marginBottom:err?8:12, textAlign:"center", letterSpacing:"0.05em" }}/>
      {err && <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--accent)", marginBottom:12 }}>{err}</p>}
      <button onClick={submit} disabled={loading} className="btn-primary" style={{ width:"100%", padding:"16px", borderRadius:10, fontSize:13, letterSpacing:"0.12em", marginBottom:16 }}>
        {loading ? "CONNECTING..." : "GET MY FREE CALLBACK →"}
      </button>
      <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted2)" }}>
        Not ready? <button onClick={()=>onDone("")} style={{ background:"none", border:"none", color:"var(--muted)", textDecoration:"underline", cursor:"none", fontFamily:"var(--font-mono)", fontSize:10 }}>Skip for now</button>
      </p>
    </motion.div>
  );
}

// ─── Report screen ────────────────────────────────────────────────────────────
function Report({ result, funnelData, onImprove }: {
  result:AuditResult; funnelData:FunnelData; onImprove:()=>void;
}) {
  const topRef = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);
  useEffect(()=>{
    // Scroll to top of report
    topRef.current?.scrollIntoView({ behavior:"smooth", block:"start" });
    const t=setTimeout(()=>setAnimated(true),200);
    return ()=>clearTimeout(t);
  },[]);

  const { metrics, adLossPercent, bounceRateIncrease, annualRevenueLoss, severity } = result;
  const sev = { critical:{label:"CRITICAL",color:"#e8341a"}, warning:{label:"WARNING",color:"#f59e0b"}, ok:{label:"HEALTHY",color:"#10b981"} }[severity];

  return (
    <motion.div ref={topRef} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.5 }}
      style={{ width:"100%", maxWidth:680, margin:"0 auto" }}>

      {/* Status bar */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, padding:"10px 16px", borderRadius:8, background:`${sev.color}10`, border:`1px solid ${sev.color}25` }}>
        <span style={{ width:8, height:8, borderRadius:"50%", background:sev.color, display:"inline-block", boxShadow:`0 0 8px ${sev.color}` }} className="animate-pulse"/>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:sev.color, letterSpacing:"0.15em", flex:1 }}>STATUS: {sev.label}</span>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)" }}>{result.url.replace(/https?:\/\//,"").substring(0,30)}</span>
      </div>

      {/* Score + revenue */}
      <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:14, marginBottom:14 }}>
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"24px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <Gauge score={metrics.performanceScore} animated={animated}/>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", letterSpacing:"0.12em" }}>PERFORMANCE</span>
        </div>
        <div style={{ background:"rgba(232,52,26,0.05)", border:"1px solid rgba(232,52,26,0.2)", borderRadius:12, padding:"24px 20px" }}>
          <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:16 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent)", display:"inline-block" }} className="animate-pulse"/>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--accent)", letterSpacing:"0.15em" }}>REVENUE IMPACT</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
            {[
              { v:`${adLossPercent}%`, l:"Ad Revenue Lost", c:"var(--accent)" },
              { v:`+${bounceRateIncrease}%`, l:"Bounce Rate", c:"var(--warn)" },
              { v:`£${Math.round(annualRevenueLoss/1000)}k`, l:"Annual Leak", c:"var(--text)" },
            ].map(s=>(
              <div key={s.l}>
                <div style={{ fontFamily:"var(--font-display)", fontSize:32, color:s.c, lineHeight:1, letterSpacing:"0.02em", textShadow:s.c==="var(--accent)"?"0 0 15px rgba(232,52,26,0.4)":"none" }}>{s.v}</div>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", marginTop:5 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted2)", marginTop:14, paddingTop:12, borderTop:"1px solid rgba(232,52,26,0.15)", lineHeight:1.6 }}>
            Google: every +100ms load time = ~1% conversion drop.
          </p>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"20px", marginBottom:14 }}>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", letterSpacing:"0.15em", marginBottom:4 }}>CORE WEB VITALS · MOBILE</p>
        <MetricRow label="Largest Contentful Paint" value={metrics.lcp} formatted={fmtMs(metrics.lcp)} thresholds={[2500,4000]}/>
        <MetricRow label="First Contentful Paint" value={metrics.fcp} formatted={fmtMs(metrics.fcp)} thresholds={[1800,3000]}/>
        <MetricRow label="Total Blocking Time" value={metrics.tbt} formatted={fmtMs(metrics.tbt)} thresholds={[200,600]}/>
        <MetricRow label="Cumulative Layout Shift" value={metrics.cls} formatted={metrics.cls.toFixed(3)} thresholds={[0.1,0.25]}/>
        <MetricRow label="Speed Index" value={metrics.speedIndex} formatted={fmtMs(metrics.speedIndex)} thresholds={[3400,5800]}/>
      </div>

      {/* "How do I improve this?" CTA */}
      <motion.button onClick={onImprove} whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
        style={{ width:"100%", padding:"20px", borderRadius:12, background:"linear-gradient(135deg,rgba(232,52,26,0.1),rgba(232,52,26,0.04))", border:"1px solid rgba(232,52,26,0.3)", cursor:"none", textAlign:"center", marginBottom:14 }}>
        <div style={{ fontFamily:"var(--font-display)", fontSize:22, color:"var(--text)", letterSpacing:"0.05em", marginBottom:6 }}>
          How do I improve this? ↓
        </div>
        <div style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text2)" }}>
          See what's fixable and what it's worth — no obligation
        </div>
      </motion.button>

      <div style={{ textAlign:"center", paddingBottom:24 }}>
        <button onClick={()=>window.location.reload()}
          style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", background:"none", border:"none", textDecoration:"underline", cursor:"none" }}>
          ↩ Audit a different site
        </button>
      </div>
    </motion.div>
  );
}

// ─── "How to improve" section ─────────────────────────────────────────────────
function ImprovementSection({ result, surveyAns, onBook }: {
  result:AuditResult; surveyAns:string; onBook:()=>void;
}) {
  const [expanded, setExpanded] = useState<string|null>(null);
  const [interestedIn, setInterestedIn] = useState<string|null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const score = result.metrics.performanceScore;

  useEffect(()=>{ ref.current?.scrollIntoView({ behavior:"smooth", block:"start" }); },[]);

  // Rank services by relevance to their audit result
  const ranked = [...SERVICES].sort((a,b)=>{
    if (score < 50) return a.id==="speed"?-1:b.id==="speed"?1:0;
    if (surveyAns==="leads"||surveyAns==="automation") return a.id==="ai"?-1:b.id==="ai"?1:0;
    return 0;
  });

  function handleCTA(id:string) {
    setInterestedIn(id);
    setTimeout(onBook, 300);
  }

  return (
    <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      style={{ width:"100%", maxWidth:580, margin:"0 auto", paddingBottom:32 }}>

      <div style={{ textAlign:"center", marginBottom:28 }}>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--accent)", letterSpacing:"0.2em", marginBottom:10 }}>YOUR IMPROVEMENT PLAN</p>
        <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(26px,5vw,38px)", color:"var(--text)", letterSpacing:"0.04em", lineHeight:1.1, marginBottom:10 }}>
          {score < 50 ? "Here's what will move the needle most." : "Here's what's worth fixing first."}
        </h2>
        <p style={{ fontFamily:"var(--font-body)", fontSize:14, color:"var(--text2)", lineHeight:1.6 }}>
          Tap any option to see how it works. No commitment — just information.
        </p>
      </div>

      {ranked.map(svc=>(
        <ServiceCard key={svc.id} svc={svc}
          expanded={expanded===svc.id}
          onExpand={()=>setExpanded(expanded===svc.id?null:svc.id)}
          onCTA={()=>handleCTA(svc.id)}/>
      ))}

      {/* Soft CTA */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
        style={{ marginTop:24, padding:"28px 24px", borderRadius:12, background:"var(--surface)", border:"1px solid var(--border)", textAlign:"center" }}>
        <p style={{ fontFamily:"var(--font-body)", fontSize:14, color:"var(--text2)", lineHeight:1.65, marginBottom:20 }}>
          Not sure which option is right for you? Our team can walk through your results in 15 minutes and tell you exactly what's worth doing and what isn't.
        </p>
        <button onClick={onBook} className="btn-primary" style={{ padding:"14px 36px", borderRadius:8, fontSize:12, letterSpacing:"0.12em" }}>
          SPEAK TO AN AGENT →
        </button>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted2)", marginTop:12 }}>Free · No pitch · 2-hour callback</p>
      </motion.div>
    </motion.div>
  );
}

// ─── Booked confirmation ──────────────────────────────────────────────────────
function Booked({ phone }: { phone:string }) {
  return (
    <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
      style={{ maxWidth:440, margin:"0 auto", textAlign:"center" }}>
      <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.1, type:"spring", stiffness:200 }}
        style={{ width:72, height:72, borderRadius:"50%", background:"rgba(16,185,129,0.12)", border:"1px solid rgba(16,185,129,0.3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", fontSize:32 }}>
        ✓
      </motion.div>
      <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(28px,5vw,42px)", color:"var(--text)", letterSpacing:"0.04em", marginBottom:12 }}>
        YOU'RE ALL SET
      </h2>
      <p style={{ fontFamily:"var(--font-body)", fontSize:15, color:"var(--text2)", lineHeight:1.65, marginBottom:24 }}>
        {phone ? `We'll call ${phone} within 2 hours.` : "One of our team will be in touch shortly."} Expect a straight conversation — no script, no pressure, just a real look at what's worth fixing on your site.
      </p>
      <div style={{ padding:"16px", borderRadius:10, background:"var(--surface)", border:"1px solid var(--border)", marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"center", gap:28 }}>
          {[["⏱","2hr callback"],["📋","Personalised plan"],["🆓","No charge"]].map(([i,l])=>(
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{i}</div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={()=>window.location.reload()}
        style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", background:"none", border:"none", textDecoration:"underline", cursor:"none" }}>
        Audit another site
      </button>
    </motion.div>
  );
}

// ─── Email gate ───────────────────────────────────────────────────────────────
function EmailGate({ onSubmit, loading }: { onSubmit:(e:string)=>Promise<void>; loading:boolean }) {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(()=>{ ref.current?.focus(); },[]);
  async function submit() {
    const t=email.trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)){setErr("Enter a valid email.");return;}
    await onSubmit(t);
  }
  return (
    <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
      style={{ position:"absolute", inset:0, zIndex:20, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(16px)", background:"rgba(3,7,15,0.92)" }}>
      <div style={{ width:"100%", maxWidth:400, background:"var(--surface)", border:"1px solid rgba(232,52,26,0.3)", borderRadius:16, padding:"36px 28px", boxShadow:"0 0 80px rgba(232,52,26,0.18)", textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:16 }}>🔒</div>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--accent)", letterSpacing:"0.2em", marginBottom:10 }}>REPORT READY</p>
        <h3 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(22px,4vw,30px)", color:"var(--text)", letterSpacing:"0.05em", marginBottom:12 }}>
          WHERE DO WE SEND IT?
        </h3>
        <p style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text2)", lineHeight:1.6, marginBottom:24 }}>
          Your diagnostic is complete. Enter your email to unlock the full breakdown.
        </p>
        <input ref={ref} type="email" value={email} placeholder="you@company.com"
          onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
          style={{ width:"100%", background:"var(--bg)", border:"1px solid var(--border2)", borderRadius:8, padding:"14px 16px", color:"var(--text)", fontFamily:"var(--font-mono)", fontSize:14, marginBottom:err?8:12 }}/>
        {err && <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--accent)", marginBottom:10 }}>{err}</p>}
        <button onClick={submit} disabled={loading} className="btn-primary" style={{ width:"100%", padding:"15px", borderRadius:8, fontSize:12, letterSpacing:"0.12em" }}>
          {loading?"UNLOCKING...":"UNLOCK MY REPORT →"}
        </button>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted2)", marginTop:14 }}>No spam · Just your results</p>
      </div>
    </motion.div>
  );
}

// ─── Main funnel ──────────────────────────────────────────────────────────────
export default function Funnel() {
  const [step, setStep] = useState<Step>("q1");
  const [data, setData] = useState<FunnelData>({});
  const [result, setResult] = useState<AuditResult|null>(null);
  const [surveyAns, setSurveyAns] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState("");
  const [showImprovement, setShowImprovement] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const go = (update: Partial<FunnelData>, next: Step) => {
    setData(p=>({...p,...update}));
    setStep(next);
  };

  const runAudit = useCallback(async (url:string) => {
    setData(p=>({...p,url}));
    setStep("loading");
    setError("");
    try {
      const r = await fetchAudit(url);
      setResult(r);
      setStep("email");
    } catch(e) {
      setError(e instanceof Error ? e.message : "Could not reach PageSpeed API.");
      setStep("url");
    }
  },[]);

  const submitEmail = useCallback(async (email:string) => {
    if(!result) return;
    setEmailLoading(true);
    try {
      await fetch("/api/capture",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ email, url:result.url, score:result.metrics.performanceScore,
          adLossPercent:result.adLossPercent, bounceRateIncrease:result.bounceRateIncrease,
          annualRevenueLoss:result.annualRevenueLoss, severity:result.severity,
          timestamp:result.timestamp, q1:data.q1, q2:data.q2, q3:data.q3, source:"funnel" }),
      });
    } catch { /* swallow */ }
    finally { setEmailLoading(false); setData(p=>({...p,email})); setStep("report"); }
  },[result,data]);

  const submitPhone = useCallback(async (phone:string) => {
    if(phone) {
      setData(p=>({...p,phone}));
      try {
        await fetch("/api/capture",{
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ email:data.email, url:result?.url, score:result?.metrics.performanceScore,
            phone, surveyAns, source:"funnel-phone" }),
        });
      } catch { /* swallow */ }
    }
    setStep("booked");
  },[data,result,surveyAns]);

  return (
    <main ref={containerRef} style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 16px", position:"relative", zIndex:10 }}>

      <AnimatePresence mode="wait">

        {/* Q1 — Pain point */}
        {step==="q1" && (
          <motion.div key="q1" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} style={{width:"100%"}}>
            <ProgressDots step="q1"/>
            <Q question="What's your biggest website frustration right now?">
              <Choice icon="⚔️" label="Losing customers to competitors with better sites" onClick={()=>go({q1:"competitors"},"q2")}/>
              <Choice icon="📉" label="Traffic's there — but people just don't convert" sub="Visitors leave without taking action" onClick={()=>go({q1:"conversions"},"q2")}/>
              <Choice icon="🐌" label="The site feels slow, especially on mobile" onClick={()=>go({q1:"speed"},"q2")}/>
              <Choice icon="🔥" label="All of the above, honestly" onClick={()=>go({q1:"all"},"q2")}/>
            </Q>
          </motion.div>
        )}

        {/* Q2 — Revenue */}
        {step==="q2" && (
          <motion.div key="q2" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} style={{width:"100%"}}>
            <ProgressDots step="q2"/>
            <Q question="How much annual revenue flows through your site?" sub="This helps us calculate your actual money at risk — not just a score.">
              <Choice icon="🌱" label="Under £10,000" sub="Early growth stage" onClick={()=>go({q2:"sub10k"},"q3")}/>
              <Choice icon="📈" label="£10k – £50k" sub="Growing steadily" onClick={()=>go({q2:"10-50k"},"q3")}/>
              <Choice icon="💼" label="£50k – £100k" sub="Main revenue channel" onClick={()=>go({q2:"50-100k"},"q3")}/>
              <Choice icon="🏆" label="£100k+" sub="Every percentage point matters" onClick={()=>go({q2:"100k+"},"q3")}/>
            </Q>
          </motion.div>
        )}

        {/* Q3 — Last audit */}
        {step==="q3" && (
          <motion.div key="q3" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} style={{width:"100%"}}>
            <ProgressDots step="q3"/>
            <Q question="When did you last run a proper performance check?" sub="Most sites quietly degrade every 90 days as new code piles up.">
              <Choice icon="🙈" label="Never — I've been flying blind" onClick={()=>go({q3:"never"},"url")}/>
              <Choice icon="📅" label="Over a year ago" sub="Things have changed since then" onClick={()=>go({q3:"year+"},"url")}/>
              <Choice icon="🔧" label="6 months ago" sub="But nothing was actually fixed" onClick={()=>go({q3:"6months"},"url")}/>
              <Choice icon="✅" label="Recently — just want a second opinion" onClick={()=>go({q3:"recent"},"url")}/>
            </Q>
          </motion.div>
        )}

        {/* URL input */}
        {step==="url" && (
          <motion.div key="url" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} style={{width:"100%"}}>
            <ProgressDots step="url"/>
            <UrlStep onAudit={runAudit} error={error} q1={data.q1}/>
          </motion.div>
        )}

        {/* Loading */}
        {step==="loading" && (
          <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{width:"100%"}}>
            <Loader url={data.url??""}/>
          </motion.div>
        )}

        {/* Email gate */}
        {step==="email" && result && (
          <motion.div key="email" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{ position:"relative", width:"100%", maxWidth:680 }}>
            <div className="blur-veil" style={{ pointerEvents:"none" }}>
              <Report result={result} funnelData={data} onImprove={()=>{}}/>
            </div>
            <EmailGate onSubmit={submitEmail} loading={emailLoading}/>
          </motion.div>
        )}

        {/* Report */}
        {step==="report" && result && !showImprovement && (
          <motion.div key="report" initial={{opacity:0}} animate={{opacity:1}} style={{width:"100%"}}>
            {/* Post-result survey — emotional investment */}
            <ResultSurvey result={result} onDone={(ans)=>{ setSurveyAns(ans); setShowImprovement(true); }}/>
            <div style={{ marginTop:24 }}>
              <Report result={result} funnelData={data} onImprove={()=>{ setShowImprovement(true); }}/>
            </div>
          </motion.div>
        )}

        {/* Improvement plan */}
        {step==="report" && result && showImprovement && (
          <motion.div key="improve" initial={{opacity:0}} animate={{opacity:1}} style={{width:"100%"}}>
            <Report result={result} funnelData={data} onImprove={()=>{}}/>
            <ImprovementSection result={result} surveyAns={surveyAns} onBook={()=>setStep("phone")}/>
          </motion.div>
        )}

        {/* Phone capture */}
        {step==="phone" && result && (
          <motion.div key="phone" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} style={{width:"100%"}}>
            <PhoneCapture result={result} surveyAns={surveyAns} onDone={submitPhone}/>
          </motion.div>
        )}

        {/* Booked */}
        {step==="booked" && (
          <motion.div key="booked" initial={{opacity:0}} animate={{opacity:1}} style={{width:"100%"}}>
            <Booked phone={data.phone??""}/>
          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}

// ─── URL step (extracted to avoid re-renders) ─────────────────────────────────
function UrlStep({ onAudit, error, q1 }: { onAudit:(u:string)=>void; error:string; q1?:string }) {
  const [url, setUrl] = useState("");
  const messages: Record<string,string> = {
    competitors:"We'll show you exactly where they're beating you.",
    conversions:"We'll pinpoint every bottleneck costing you sales.",
    speed:"We'll measure every millisecond of friction.",
    all:"We'll give you the full picture — nothing held back.",
  };
  const sub = q1 ? messages[q1] : "Let's see what's really going on.";
  return (
    <Q question="Drop your URL. See the truth in 60 seconds." sub={sub}>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:8 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:4 }}>
          {[["60s","To complete"],["Free","No card"],["Real","Google data"]].map(([v,l])=>(
            <div key={l} style={{ textAlign:"center", padding:"10px 8px", borderRadius:8, background:"var(--surface)", border:"1px solid var(--border)" }}>
              <div style={{ fontFamily:"var(--font-display)", fontSize:20, color:"var(--accent)", letterSpacing:"0.04em" }}>{v}</div>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
        <input type="text" value={url} onChange={e=>setUrl(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&url.trim()&&onAudit(url)}
          placeholder="https://yourwebsite.com" autoFocus
          style={{ width:"100%", background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:10, padding:"16px 18px", color:"var(--text)", fontFamily:"var(--font-mono)", fontSize:14, transition:"border-color 0.2s" }}/>
        {error && <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--accent)" }}>⚠ {error}</p>}
        <button onClick={()=>url.trim()&&onAudit(url)} disabled={!url.trim()} className="btn-primary" style={{ padding:"16px", borderRadius:10, fontSize:13, letterSpacing:"0.12em" }}>
          SCAN MY SITE NOW →
        </button>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted2)", textAlign:"center" }}>Powered by Google PageSpeed · No account needed</p>
      </div>
    </Q>
  );
}