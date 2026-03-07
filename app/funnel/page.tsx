"use client";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAudit } from "../lib/audit";
import type { AuditResult } from "../lib/audit";
import { TerminalLoader, EmailGate, ResultsPanel } from "../components/shared";

type Step = "q1"|"q2"|"q3"|"url"|"loading"|"email"|"report"|"discover"|"pitch"|"phone"|"booked";
interface FunnelData { q1?:string; q2?:string; q3?:string; url?:string; email?:string; phone?:string; businessType?:string; goal?:string; }

// ─── Survey progress dots ─────────────────────────────────────────────────────
const SURVEY_STEPS = ["q1","q2","q3","url"];
function ProgressDots({ step }: { step: Step }) {
  const idx = SURVEY_STEPS.indexOf(step);
  if (idx === -1) return null;
  return (
    <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:28 }}>
      {SURVEY_STEPS.map((_,i) => (
        <motion.div key={i} animate={{ width:i===idx?24:6, background:i<=idx?"#e8341a":"#0e1e35" }}
          style={{ height:6, borderRadius:3 }} transition={{ duration:0.3 }} />
      ))}
    </div>
  );
}

// ─── Auto-advance choice tile ─────────────────────────────────────────────────
function Choice({ label, sub, icon, onClick }: { label:string; sub?:string; icon:string; onClick:()=>void }) {
  const [flash, setFlash] = useState(false);
  function handle() { setFlash(true); setTimeout(onClick, 200); }
  return (
    <motion.button onClick={handle} whileHover={{ scale:1.015 }} whileTap={{ scale:0.975 }}
      style={{ width:"100%", textAlign:"left", padding:"15px 18px", marginBottom:9, borderRadius:12,
        background: flash?"rgba(232,52,26,0.1)":"var(--surface)",
        border:`1px solid ${flash?"#e8341a":"var(--border)"}`,
        boxShadow: flash?"0 0 18px rgba(232,52,26,0.15)":"none",
        cursor:"pointer", transition:"all 0.12s", display:"flex", alignItems:"center", gap:12 }}>
      <span style={{ fontSize:20, lineHeight:1, flexShrink:0 }}>{icon}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"var(--font-body)", fontWeight:500, fontSize:15, color:flash?"#e8341a":"var(--text)", transition:"color 0.12s" }}>{label}</div>
        {sub && <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", marginTop:2 }}>{sub}</div>}
      </div>
      <motion.span animate={{ x:flash?6:0 }} style={{ color:"var(--muted)", fontSize:14, flexShrink:0 }}>→</motion.span>
    </motion.button>
  );
}

// ─── Question wrapper ─────────────────────────────────────────────────────────
function Q({ q, sub, children }: { q:string; sub?:string; children:React.ReactNode }) {
  return (
    <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-16 }}
      transition={{ duration:0.3,ease:[0.16,1,0.3,1] }} style={{ width:"100%",maxWidth:500,margin:"0 auto" }}>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(26px,6vw,40px)", color:"var(--text)", letterSpacing:"0.03em", lineHeight:1.05, marginBottom:sub?10:0 }}>{q}</h2>
        {sub && <p style={{ fontFamily:"var(--font-body)", fontSize:14, color:"var(--text2)", lineHeight:1.6 }}>{sub}</p>}
      </div>
      {children}
    </motion.div>
  );
}

// ─── Personalised pitch engine ────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { val:"ecom",    icon:"🛒", label:"E-commerce / Online store",       sub:"Selling products or services online" },
  { val:"service", icon:"💼", label:"Service business / Agency",       sub:"Leads, enquiries, bookings" },
  { val:"local",   icon:"📍", label:"Local / Brick & mortar business", sub:"Driving foot traffic or local calls" },
  { val:"saas",    icon:"💻", label:"SaaS / Tech product",             sub:"Free trials, signups, demos" },
];
const GOALS = [
  { val:"leads",    icon:"🎯", label:"Get more leads from existing traffic" },
  { val:"speed",    icon:"⚡", label:"Make the site faster — it's embarrassing" },
  { val:"convert",  icon:"💰", label:"Turn more visitors into paying customers" },
  { val:"automate", icon:"🤖", label:"Stop manually chasing leads — automate it" },
];
interface PitchData {
  headline:string; subline:string;
  services:{ id:string; icon:string; title:string; hook:string; desc:string; proof:string; price:string; urgency:string; actionType: "book" | "subscribe" }[];
}
function buildPitch(result:AuditResult, fd:FunnelData): PitchData {
  const score=result.metrics.performanceScore, loss=Math.round(result.annualRevenueLoss/1000), bt=fd.businessType||"service", goal=fd.goal||"leads";
  const hooks:Record<string,string> = {
    ecom:`Your store is losing £${loss}k/year in abandoned carts before customers even see your products.`,
    service:`Potential clients are hitting your site and leaving before they ever pick up the phone.`,
    local:`People are searching for exactly what you offer — and choosing the competitor with a faster site.`,
    saas:`Signups are dropping off during your trial flow because the page takes too long to respond.`,
  };
  const services: PitchData["services"] = [];
  
  if (score < 70) services.push({ id:"speed",icon:"⚡",title:"Site Speed Rebuild",
    hook:bt==="ecom"?"Faster checkout = more completed purchases":bt==="local"?"Load faster than your local competitors":"Load in under 1.5s — guaranteed",
    desc:"We rebuild your pages on our performance infrastructure. Target: sub-1.5s load time on mobile. Most clients see a 40–60% bounce rate drop in week one.",
    proof:"✓ TechFlow: score 24→91, bounce rate down 58%, enquiries 3× in 30 days.",
    price:"From £1,200 · Fixed price · 5-day turnaround",
    urgency:score<40?"Your score is CRITICAL — every day costs you money.":"Your score is below Google's recommended threshold.",
    actionType: "book"
  });
  
  if (goal==="leads"||goal==="automate"||bt==="service"||bt==="local") services.push({ id:"ai",icon:"🤖",title:"AI Lead Response Agent",
    hook:"Respond to every enquiry in under 90 seconds. Even at midnight.",
    desc:"Your current response time is probably hours. Ours is 90 seconds. The AI qualifies the lead, answers their question, and books a call — before they've had time to check your competitor.",
    proof:"✓ Patel Plumbing: 6 new bookings in the first week.",
    price:"From £350/mo · Setup in 48hrs · Cancel anytime",
    urgency:"The average business takes 47 hours to respond. You're losing to whoever responds first.",
    actionType: "book"
  });
  
  // The SaaS Upsell
  services.push({ id:"subscribe",icon:"📊",title:"Nexus Pulse — Performance Intelligence",
    hook:"Know before your competitors do. Weekly automated audit + competitor benchmarking.",
    desc:"Every week: your site re-audited + a benchmarking report showing how you compare to the top 10 sites in your sector. SMS alert if a competitor overtakes you.",
    proof:"✓ Luxe Interiors: 'We use the benchmarking report in our board meetings.'",
    price:"$49/mo · 7-day free trial · Cancel anytime",
    urgency:"Businesses that track their performance regularly are 3× more likely to stay ahead of algorithm changes.",
    actionType: "subscribe"
  });

  return {
    headline:bt==="ecom"?`Your store is leaving £${loss}k on the table.`:`£${loss}k/year is leaking — here's the exact plan.`,
    subline:hooks[bt]||hooks.service,
    services:services.slice(0,3), // Keep max 3 options
  };
}

// ─── Discover — 2 quick questions after seeing results ───────────────────────
function Discover({ onDone }: { onDone:(bt:string,goal:string)=>void }) {
  const [bt, setBt] = useState<string|null>(null);
  const ref = useRef<HTMLDivElement>(null);
  
  if (!bt) return (
    <motion.div ref={ref} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} style={{ width:"100%",maxWidth:500,margin:"24px auto 0" }}>
      <div style={{ textAlign:"center",marginBottom:22 }}>
        <p style={{ fontFamily:"var(--font-mono)",fontSize:10,color:"var(--accent)",letterSpacing:"0.2em",marginBottom:8 }}>ONE MORE THING</p>
        <h2 style={{ fontFamily:"var(--font-display)",fontSize:"clamp(24px,5vw,36px)",color:"var(--text)",letterSpacing:"0.04em",lineHeight:1.1 }}>What kind of business is this?</h2>
        <p style={{ fontFamily:"var(--font-body)",fontSize:13,color:"var(--text2)",marginTop:8 }}>Personalises your recommendations — takes 10 seconds.</p>
      </div>
      {BUSINESS_TYPES.map(c => <Choice key={c.val} icon={c.icon} label={c.label} sub={c.sub} onClick={() => setBt(c.val)} />)}
    </motion.div>
  );
  
  return (
    <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} style={{ width:"100%",maxWidth:500,margin:"24px auto 0" }}>
      <div style={{ textAlign:"center",marginBottom:22 }}>
        <h2 style={{ fontFamily:"var(--font-display)",fontSize:"clamp(24px,5vw,36px)",color:"var(--text)",letterSpacing:"0.04em",lineHeight:1.1 }}>What matters most right now?</h2>
        <p style={{ fontFamily:"var(--font-body)",fontSize:13,color:"var(--text2)",marginTop:8 }}>No wrong answer — this shapes your personalised plan.</p>
      </div>
      {GOALS.map(c => <Choice key={c.val} icon={c.icon} label={c.label} onClick={() => onDone(bt, c.val)} />)}
    </motion.div>
  );
}

// ─── Personalised pitch section ───────────────────────────────────────────────
function Pitch({ pitch, onBook }: { pitch:PitchData; onBook:()=>void }) {
  const [expanded, setExpanded] = useState<string|null>(pitch.services[0]?.id||null);
  const ref = useRef<HTMLDivElement>(null);
  
  return (
    <motion.div ref={ref} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} style={{ width:"100%",maxWidth:600,margin:"0 auto",paddingBottom:32 }}>
      <div style={{ textAlign:"center",marginBottom:28 }}>
        <p style={{ fontFamily:"var(--font-mono)",fontSize:10,color:"var(--accent)",letterSpacing:"0.2em",marginBottom:10 }}>YOUR PERSONALISED PLAN</p>
        <h2 style={{ fontFamily:"var(--font-display)",fontSize:"clamp(24px,5vw,36px)",color:"var(--text)",letterSpacing:"0.04em",lineHeight:1.1,marginBottom:10 }}>{pitch.headline}</h2>
        <p style={{ fontFamily:"var(--font-body)",fontSize:14,color:"var(--text2)",lineHeight:1.65 }}>{pitch.subline}</p>
      </div>
      {pitch.services.map((svc,i) => {
        const isOpen=expanded===svc.id;
        return (
          <motion.div key={svc.id} initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.1 }}
            style={{ borderRadius:12,overflow:"hidden",background:isOpen?"rgba(232,52,26,0.04)":"var(--surface)",border:`1px solid ${isOpen?"rgba(232,52,26,0.28)":"var(--border)"}`,marginBottom:10,transition:"all 0.2s" }}>
            <button onClick={() => setExpanded(isOpen?null:svc.id)}
              style={{ width:"100%",padding:"18px 20px",display:"flex",alignItems:"center",gap:14,background:"none",border:"none",cursor:"pointer",textAlign:"left" }}>
              <span style={{ fontSize:22,flexShrink:0 }}>{svc.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"var(--font-body)",fontWeight:600,fontSize:15,color:"var(--text)",marginBottom:3 }}>{svc.title}</div>
                <div style={{ fontFamily:"var(--font-mono)",fontSize:11,color:"var(--muted)" }}>{svc.hook}</div>
              </div>
              <motion.span animate={{ rotate:isOpen?180:0 }} style={{ color:"var(--muted)",fontSize:12,flexShrink:0 }}>▼</motion.span>
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height:0,opacity:0 }} animate={{ height:"auto",opacity:1 }} exit={{ height:0,opacity:0 }} transition={{ duration:0.28,ease:[0.16,1,0.3,1] }} style={{ overflow:"hidden" }}>
                  <div style={{ padding:"0 20px 22px" }}>
                    <div style={{ height:1,background:"var(--border)",marginBottom:16 }} />
                    <div style={{ padding:"10px 14px",borderRadius:8,background:"rgba(232,52,26,0.06)",border:"1px solid rgba(232,52,26,0.15)",marginBottom:14 }}>
                      <p style={{ fontFamily:"var(--font-mono)",fontSize:11,color:"var(--accent)",lineHeight:1.6 }}>⚠ {svc.urgency}</p>
                    </div>
                    <p style={{ fontFamily:"var(--font-body)",fontSize:14,color:"var(--text2)",lineHeight:1.65,marginBottom:14 }}>{svc.desc}</p>
                    <div style={{ padding:"12px 14px",borderRadius:8,background:"var(--surface2)",border:"1px solid var(--border2)",marginBottom:16 }}>
                      <p style={{ fontFamily:"var(--font-mono)",fontSize:11,color:"var(--text2)",lineHeight:1.6,fontStyle:"italic" }}>{svc.proof}</p>
                    </div>
                    <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap" }}>
                      
                      {/* 🚀 THE SMART ROUTER BUTTON */}
                      <button onClick={() => {
                          if (svc.actionType === "subscribe") {
                            window.location.href = "/subscribe"; // Send straight to checkout!
                          } else {
                            onBook(); // Send to Agency Phone Capture
                          }
                        }}
                        className="btn-primary" style={{ flex:1,padding:"14px",borderRadius:8,fontSize:12,letterSpacing:"0.1em",minWidth:160 }}>
                        {svc.actionType === "subscribe" ? "ACTIVATE SOFTWARE →" : "REQUEST CALLBACK →"}
                      </button>

                      <span style={{ fontFamily:"var(--font-mono)",fontSize:11,color:"var(--muted)",whiteSpace:"nowrap" }}>{svc.price}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ─── Phone capture ────────────────────────────────────────────────────────────
function PhoneCapture({ result, fd, onDone }: { result:AuditResult; fd:FunnelData; onDone:(p:string)=>void }) {
  const [phone, setPhone] = useState(""); const [err, setErr] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const loss = Math.round(result.annualRevenueLoss/1000);
  const sc = result.metrics.performanceScore;
  function submit() { const t=phone.replace(/\s/g,""); if(t.length<7){setErr("Enter a valid number.");return;} onDone(phone); }
  return (
    <motion.div initial={{ opacity:0,y:24 }} animate={{ opacity:1,y:0 }} style={{ maxWidth:440,margin:"0 auto",textAlign:"center" }}>
      <motion.div initial={{ scale:0.8,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ delay:0.1 }}
        style={{ display:"inline-flex",alignItems:"center",gap:10,padding:"10px 20px",borderRadius:100,background:"rgba(232,52,26,0.08)",border:"1px solid rgba(232,52,26,0.25)",marginBottom:22 }}>
        <span style={{ fontFamily:"var(--font-display)",fontSize:26,color:"var(--accent)",lineHeight:1 }}>{sc}</span>
        <div style={{ textAlign:"left" }}>
          <div style={{ fontFamily:"var(--font-mono)",fontSize:10,color:"var(--accent)",letterSpacing:"0.12em" }}>YOUR SCORE</div>
          <div style={{ fontFamily:"var(--font-mono)",fontSize:10,color:"var(--muted)" }}>{sc<50?"CRITICAL":sc<80?"NEEDS WORK":"GOOD"}</div>
        </div>
      </motion.div>
      <h2 style={{ fontFamily:"var(--font-display)",fontSize:"clamp(26px,5vw,38px)",color:"var(--text)",letterSpacing:"0.03em",lineHeight:1.1,marginBottom:12 }}>
        {loss>0?`Let's stop that £${loss}k leak together.`:"Let's build you a plan."}
      </h2>
      <p style={{ fontFamily:"var(--font-body)",fontSize:14,color:"var(--text2)",lineHeight:1.65,marginBottom:26 }}>
        Drop your number. One of our team calls within <strong style={{ color:"var(--text)" }}>2 hours</strong>. No script, no pressure — just a straight conversation about what&apos;s worth fixing first.
      </p>
      <input ref={ref} type="tel" value={phone} placeholder="+44 7700 000000"
        onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key==="Enter"&&submit()}
        style={{ width:"100%",background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:10,padding:"16px 18px",color:"var(--text)",fontFamily:"var(--font-mono)",fontSize:16,marginBottom:err?8:12,textAlign:"center",letterSpacing:"0.04em" }} />
      {err && <p style={{ fontFamily:"var(--font-mono)",fontSize:11,color:"var(--accent)",marginBottom:10 }}>{err}</p>}
      <button onClick={submit} className="btn-primary" style={{ width:"100%",padding:"16px",borderRadius:10,fontSize:13,letterSpacing:"0.12em",marginBottom:14 }}>
        GET MY FREE CALLBACK →
      </button>
    </motion.div>
  );
}

// ─── Booked ───────────────────────────────────────────────────────────────────
function Booked({ phone }: { phone:string }) {
  return (
    <motion.div initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }} style={{ maxWidth:420,margin:"0 auto",textAlign:"center" }}>
      <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.1,type:"spring",stiffness:180 }}
        style={{ width:70,height:70,borderRadius:"50%",background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 22px",fontSize:30 }}>✓</motion.div>
      <h2 style={{ fontFamily:"var(--font-display)",fontSize:"clamp(28px,5vw,40px)",color:"var(--text)",letterSpacing:"0.04em",marginBottom:12 }}>YOU&apos;RE ALL SET</h2>
      <p style={{ fontFamily:"var(--font-body)",fontSize:14,color:"var(--text2)",lineHeight:1.65,marginBottom:22 }}>
        {phone?`We'll call ${phone} within 2 hours.`:"We'll be in touch shortly."}
      </p>
    </motion.div>
  );
}

// ─── URL step ─────────────────────────────────────────────────────────────────
function UrlStep({ onAudit, error, q1 }: { onAudit:(u:string)=>void; error:string; q1?:string }) {
  const [url, setUrl] = useState("");
  const msg:Record<string,string> = { competitors:"We'll show you exactly where they're beating you.", conversions:"We'll pinpoint every bottleneck costing you sales.", speed:"We'll measure every millisecond of friction.", all:"We'll give you the full picture." };
  return (
    <Q q="Drop your URL. See the truth in 60 seconds." sub={q1?msg[q1]:"Let's see what's really going on."}>
      <input type="text" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key==="Enter"&&url.trim()&&onAudit(url)}
        placeholder="https://yourwebsite.com" autoFocus
        style={{ width:"100%",background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:10,padding:"16px 18px",color:"var(--text)",fontFamily:"var(--font-mono)",fontSize:14,marginBottom:error?8:10 }} />
      {error && <p style={{ fontFamily:"var(--font-mono)",fontSize:11,color:"var(--accent)",marginBottom:10 }}>⚠ {error}</p>}
      <button onClick={() => url.trim()&&onAudit(url)} disabled={!url.trim()} className="btn-primary" style={{ width:"100%",padding:"16px",borderRadius:10,fontSize:13,letterSpacing:"0.12em" }}>
        SCAN MY SITE NOW →
      </button>
    </Q>
  );
}

// ─── Main funnel ──────────────────────────────────────────────────────────────
export default function Funnel() {
  const [step, setStep] = useState<Step>("q1");
  const [fd, setFd] = useState<FunnelData>({});
  const [result, setResult] = useState<AuditResult|null>(null);
  const [pitch, setPitch] = useState<PitchData|null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState("");

  const go = (update:Partial<FunnelData>, next:Step) => { setFd(p=>({...p,...update})); setStep(next); };

  const runAudit = useCallback(async (url:string) => {
    setFd(p=>({...p,url})); setStep("loading"); setError("");
    try { const r=await fetchAudit(url); setResult(r); setStep("email"); }
    catch(e) { setError(e instanceof Error?e.message:"Could not reach PageSpeed API."); setStep("url"); }
  }, []);

  const submitEmail = useCallback(async (email:string) => {
    if(!result) return;
    setEmailLoading(true);
    try { await fetch("/api/capture",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,url:result.url,score:result.metrics.performanceScore,adLossPercent:result.adLossPercent,bounceRateIncrease:result.bounceRateIncrease,annualRevenueLoss:result.annualRevenueLoss,severity:result.severity,timestamp:result.timestamp,...fd,source:"funnel"})}); }
    catch { /* swallow */ }
    finally { setEmailLoading(false); setFd(p=>({...p,email})); setStep("report"); }
  }, [result, fd]);

  const submitPhone = useCallback(async (phone:string) => {
    if(phone) { setFd(p=>({...p,phone}));
      try { await fetch("/api/capture",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:fd.email,url:result?.url,score:result?.metrics.performanceScore,phone,...fd,source:"funnel-phone"})}); }
      catch { /* swallow */ }
    }
    setStep("booked");
  }, [fd, result]);

  const handleDiscover = (bt:string, goal:string) => {
    const updated = {...fd, businessType:bt, goal};
    setFd(updated);
    if(result) setPitch(buildPitch(result, updated));
    setStep("pitch");
  };

  const isSurveyStep = ["q1","q2","q3","url","loading","phone","booked"].includes(step);

  return (
    <main style={{ minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:isSurveyStep?"center":"flex-start",padding:isSurveyStep?"40px 16px 32px":"0 16px 32px",position:"relative",zIndex:10 }}>
      
      {/* Universal Back to Home Nav */}
      <nav style={{ position: "absolute", top: 0, left: 0, padding: "24px", width: "100%" }}>
         <a href="/" style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", textDecoration:"none" }}>← RETURN HOME</a>
      </nav>

      <AnimatePresence mode="wait">

        {step==="q1" && <motion.div key="q1" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-16 }} style={{ width:"100%" }}>
          <ProgressDots step="q1"/>
          <Q q="What's your biggest website frustration right now?">
            <Choice icon="⚔️" label="Losing customers to competitors with better sites" onClick={()=>go({q1:"competitors"},"q2")}/>
            <Choice icon="📉" label="Traffic's there — people just don't convert" sub="Visitors leave without taking action" onClick={()=>go({q1:"conversions"},"q2")}/>
            <Choice icon="🐌" label="Site feels slow, especially on mobile" onClick={()=>go({q1:"speed"},"q2")}/>
            <Choice icon="🔥" label="All of the above, honestly" onClick={()=>go({q1:"all"},"q2")}/>
          </Q>
        </motion.div>}

        {step==="q2" && <motion.div key="q2" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-16 }} style={{ width:"100%" }}>
          <ProgressDots step="q2"/>
          <Q q="How much annual revenue flows through your site?" sub="This helps us calculate your actual money at risk.">
            <Choice icon="🌱" label="Under £10,000" sub="Early growth stage" onClick={()=>go({q2:"sub10k"},"q3")}/>
            <Choice icon="📈" label="£10k – £50k" onClick={()=>go({q2:"10-50k"},"q3")}/>
            <Choice icon="💼" label="£50k – £100k" sub="Main revenue channel" onClick={()=>go({q2:"50-100k"},"q3")}/>
            <Choice icon="🏆" label="£100k+" sub="Every % point matters" onClick={()=>go({q2:"100k+"},"q3")}/>
          </Q>
        </motion.div>}

        {step==="q3" && <motion.div key="q3" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-16 }} style={{ width:"100%" }}>
          <ProgressDots step="q3"/>
          <Q q="When did you last run a proper performance check?" sub="Most sites quietly degrade every 90 days.">
            <Choice icon="🙈" label="Never — I've been flying blind" onClick={()=>go({q3:"never"},"url")}/>
            <Choice icon="📅" label="Over a year ago" onClick={()=>go({q3:"year+"},"url")}/>
            <Choice icon="🔧" label="6 months ago" sub="But nothing was fixed" onClick={()=>go({q3:"6months"},"url")}/>
            <Choice icon="✅" label="Recently — just want a second opinion" onClick={()=>go({q3:"recent"},"url")}/>
          </Q>
        </motion.div>}

        {step==="url" && <motion.div key="url" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-16 }} style={{ width:"100%" }}>
          <ProgressDots step="url"/>
          <UrlStep onAudit={runAudit} error={error} q1={fd.q1}/>
        </motion.div>}

        {step==="loading" && <motion.div key="loading" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ width:"100%" }}>
          <TerminalLoader url={fd.url??""} />
        </motion.div>}

        {step==="email" && result && (
          <motion.div key="email" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ width:"100%", maxWidth:860, paddingTop:40 }}>
            <div className="blur-veil" style={{ pointerEvents:"none", userSelect:"none", minHeight:"100vh" }}>
              <ResultsPanel result={result} />
            </div>
            <EmailGate onSubmit={submitEmail} loading={emailLoading} />
          </motion.div>
        )}

        {/* Instead of showing the chaotic results panel again during Discover, we isolate the questions for focus */}
        {step==="report" && result && (
          <motion.div key="report" initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ width:"100%" }}>
            <ResultsPanel result={result} onDiscover={() => setStep("discover")} />
          </motion.div>
        )}

        {step==="discover" && (
          <motion.div key="discover" initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ width:"100%" }}>
            <Discover onDone={handleDiscover} />
          </motion.div>
        )}

        {step==="pitch" && pitch && (
          <motion.div key="pitch" initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ width:"100%" }}>
            <Pitch pitch={pitch} onBook={() => setStep("phone")} />
          </motion.div>
        )}

        {step==="phone" && result && (
          <motion.div key="phone" initial={{ opacity:0,y:24 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-16 }} style={{ width:"100%" }}>
            <PhoneCapture result={result} fd={fd} onDone={submitPhone} />
          </motion.div>
        )}

        {step==="booked" && (
          <motion.div key="booked" initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ width:"100%" }}>
            <Booked phone={fd.phone??""} />
          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}