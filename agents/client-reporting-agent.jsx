import { useState, useRef, useCallback } from "react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const T = {
  bg:        "#0D0D0C",
  bgCard:    "#141413",
  bgElevate: "#1C1C1A",
  bgInput:   "#181817",
  border:    "rgba(255,255,255,0.07)",
  borderMid: "rgba(255,255,255,0.13)",
  borderHi:  "rgba(255,255,255,0.22)",
  text:      "#E8E8E3",
  textMuted: "#7A7A74",
  textHint:  "#4A4A46",
  teal:      "#3ECFA0",
  tealDim:   "#1D7A5F",
  tealBg:    "rgba(62,207,160,0.08)",
  amber:     "#F0A429",
  amberBg:   "rgba(240,164,41,0.08)",
  red:       "#E05252",
  redBg:     "rgba(224,82,82,0.08)",
  blue:      "#5B9CF6",
  blueBg:    "rgba(91,156,246,0.08)",
};

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the Client Reporting Intelligence Agent — an elite e-commerce analytics advisor for TCP Commerce.

Your job: transform raw, messy marketplace data (CSVs, copy-pasted reports, screenshots described in text, Amazon Seller Central exports, Shopify summaries, or any client performance data) into a polished executive intelligence brief.

You MUST respond with valid JSON only. No markdown, no preamble, no explanation outside the JSON structure.

Return exactly this structure:
{
  "clientName": "inferred client or brand name, or 'Client' if unknown",
  "reportPeriod": "inferred time period or 'Recent Period'",
  "executiveSummary": "2-3 sentence executive summary. Direct, confident, no fluff. What is the headline story?",
  "performanceScore": <integer 0-100 representing overall health>,
  "scoreRationale": "one sentence explaining the score",
  "metrics": [
    {
      "label": "metric name",
      "value": "formatted value (e.g. $142,300 or 3.8% or 1,204 units)",
      "trend": "up" | "down" | "flat",
      "trendPct": "e.g. +12% or -8% or flat",
      "status": "good" | "warning" | "critical" | "neutral",
      "note": "one sharp sentence of context"
    }
  ],
  "trendAnalysis": [
    {
      "title": "trend title",
      "body": "2-3 sentences. Be specific with numbers where possible."
    }
  ],
  "anomalies": [
    {
      "severity": "high" | "medium" | "low",
      "title": "anomaly title",
      "detail": "what is unusual and why it matters"
    }
  ],
  "actionStack": [
    {
      "priority": 1,
      "horizon": "immediate" | "this week" | "this month",
      "action": "specific, actionable recommendation — not vague",
      "rationale": "why this action, why now"
    }
  ],
  "clientBrief": "The client-facing paragraph. Polished, confident, no jargon. 3-4 sentences. This is what gets copy-pasted into the client email."
}

Rules:
- Extract every number you can find and put it in metrics.
- If data is thin, still produce a full brief with what you have and note limitations.
- actionStack must have 3-5 items, ordered by priority.
- anomalies: identify at least 1, up to 4.
- trendAnalysis: 2-4 trend items.
- Be direct. No hedging. This is intelligence, not a disclaimer.`;

// ─── SAMPLE DATA ─────────────────────────────────────────────────────────────
const SAMPLE_DATA = `Amazon Seller Central - Weekly Performance Summary
Account: BrightHome Essentials | Week of May 5-11, 2026

SALES OVERVIEW
Total Revenue: $38,420
vs Last Week: -$4,210 (-9.9%)
vs Same Week Last Year: +$11,800 (+44.3%)
Units Sold: 1,847
Orders: 1,203
Average Order Value: $31.93

TOP PERFORMING ASINs
B08X7K2LMN - Bamboo Cutting Board Set 3pc: $8,340 (217 units) - BSR #142 Kitchen
B09QR4T8VS - Silicone Spatula Set 6pc: $6,820 (389 units) - BSR #88 Kitchen  
B07NP3XK9A - Stainless Steel Mixing Bowls: $5,910 (142 units) - BSR #201 Kitchen

UNDERPERFORMERS
B08MK9TR3X - Ceramic Knife Set: $420 (12 units) - BSR dropped from #340 to #892
B09XQ7LP2R - Bamboo Spoon Set: $180 (18 units) - 3 returns, 2 negative reviews this week

ADVERTISING
PPC Spend: $3,840
ACOS: 28.4% (target 22%)
Clicks: 14,200
Conversion Rate: 8.2%
Impressions: 187,000

INVENTORY
Bamboo Cutting Board: 142 units (est. 6.5 days coverage at current velocity)
Silicone Spatula Set: 890 units (46 days)
Ceramic Knife Set: 312 units (26 days - concern given low velocity)

ACCOUNT HEALTH
Order Defect Rate: 0.42% (threshold 1%)
Late Shipment Rate: 1.8% (threshold 4%)
Buy Box %: 91.3%
Feedback Score: 4.6 stars (48 ratings this week)

NOTES FROM ACCOUNT MANAGER:
- Mother's Day traffic spike expected next week
- Competitor "KitchenPro" dropped Bamboo Board price by 15% Thursday
- Need to discuss Ceramic Knife Set - may need to pull PPC`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const statusColor = (s) => ({
  good:     T.teal,
  warning:  T.amber,
  critical: T.red,
  neutral:  T.textMuted,
}[s] || T.textMuted);

const statusBg = (s) => ({
  good:     T.tealBg,
  warning:  T.amberBg,
  critical: T.redBg,
  neutral:  "transparent",
}[s] || "transparent");

const severityColor = (s) => ({
  high:   T.red,
  medium: T.amber,
  low:    T.textMuted,
}[s] || T.textMuted);

const horizonColor = (h) => ({
  immediate:    T.red,
  "this week":  T.amber,
  "this month": T.teal,
}[h] || T.textMuted);

const trendIcon = (t) => t === "up" ? "↑" : t === "down" ? "↓" : "→";
const trendCol  = (t, s) => s === "critical" ? T.red : s === "warning" ? T.amber : t === "up" ? T.teal : t === "down" ? T.red : T.textMuted;

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const r = 44, cx = 52, cy = 52;
  const circ = 2 * Math.PI * r;
  const pct  = score / 100;
  const col  = score >= 70 ? T.teal : score >= 45 ? T.amber : T.red;
  return (
    <svg width="104" height="104" style={{ display:"block" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.border} strokeWidth="6"/>
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={col} strokeWidth="6"
        strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fill={col}
        style={{ fontSize:22, fontWeight:600, fontFamily:"'DM Mono',monospace" }}>{score}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={T.textMuted}
        style={{ fontSize:10, fontFamily:"'DM Mono',monospace" }}>/100</text>
    </svg>
  );
}

function MetricCard({ m }) {
  return (
    <div style={{
      background: T.bgCard, border: `0.5px solid ${T.border}`,
      borderRadius: 12, padding: "14px 16px",
      borderLeft: `2px solid ${statusColor(m.status)}`,
    }}>
      <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color: T.textMuted,
        letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>{m.label}</div>
      <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:4 }}>
        <span style={{ fontSize:20, fontWeight:600, color: T.text, fontFamily:"'DM Mono',monospace" }}>{m.value}</span>
        <span style={{ fontSize:12, color: trendCol(m.trend, m.status), fontFamily:"'DM Mono',monospace" }}>
          {trendIcon(m.trend)} {m.trendPct}
        </span>
      </div>
      <div style={{ fontSize:11.5, color: T.textMuted, lineHeight:1.5 }}>{m.note}</div>
      <div style={{ marginTop:8, display:"inline-block", fontSize:10, fontFamily:"'DM Mono',monospace",
        padding:"2px 8px", borderRadius:4, background: statusBg(m.status),
        color: statusColor(m.status), border: `0.5px solid ${statusColor(m.status)}40` }}>
        {m.status}
      </div>
    </div>
  );
}

function AnomalyRow({ a }) {
  return (
    <div style={{ display:"flex", gap:12, padding:"12px 0",
      borderBottom:`0.5px solid ${T.border}`, alignItems:"flex-start" }}>
      <div style={{ marginTop:2, width:8, height:8, borderRadius:"50%",
        background: severityColor(a.severity), flexShrink:0 }} />
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
          <span style={{ fontSize:13, fontWeight:500, color: T.text }}>{a.title}</span>
          <span style={{ fontSize:10, fontFamily:"'DM Mono',monospace",
            color: severityColor(a.severity), letterSpacing:"0.08em" }}>
            {a.severity.toUpperCase()}
          </span>
        </div>
        <div style={{ fontSize:12.5, color: T.textMuted, lineHeight:1.55 }}>{a.detail}</div>
      </div>
    </div>
  );
}

function ActionRow({ a }) {
  const hCol = horizonColor(a.horizon);
  return (
    <div style={{ display:"flex", gap:14, padding:"14px 0",
      borderBottom:`0.5px solid ${T.border}`, alignItems:"flex-start" }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:20, fontWeight:600,
        color: T.border, minWidth:28, lineHeight:1 }}>
        {String(a.priority).padStart(2,"0")}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <span style={{ fontSize:13, fontWeight:500, color: T.text }}>{a.action}</span>
          <span style={{ fontSize:10, fontFamily:"'DM Mono',monospace", padding:"2px 8px",
            borderRadius:4, color: hCol,
            background: `${hCol}15`, border:`0.5px solid ${hCol}40`,
            whiteSpace:"nowrap" }}>{a.horizon}</span>
        </div>
        <div style={{ fontSize:12.5, color: T.textMuted, lineHeight:1.55 }}>{a.rationale}</div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ClientReportingAgent() {
  const [rawInput,  setRawInput]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [report,    setReport]    = useState(null);
  const [error,     setError]     = useState(null);
  const [phase,     setPhase]     = useState("idle"); // idle | processing | done
  const [phaseMsg,  setPhaseMsg]  = useState("");
  const resultRef = useRef(null);

  const phases = [
    "Parsing marketplace data...",
    "Extracting performance signals...",
    "Detecting anomalies...",
    "Generating executive brief...",
    "Stacking action recommendations...",
  ];

  const loadSample = () => setRawInput(SAMPLE_DATA);

  const runAgent = useCallback(async () => {
    if (!rawInput.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);
    setPhase("processing");

    let pi = 0;
    setPhaseMsg(phases[0]);
    const phaseTimer = setInterval(() => {
      pi = Math.min(pi + 1, phases.length - 1);
      setPhaseMsg(phases[pi]);
    }, 900);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: rawInput }],
        }),
      });

      const data = await res.json();
      clearInterval(phaseTimer);

      if (!res.ok) throw new Error(data?.error?.message || "API error");

      const text = data.content
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("");

      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setReport(parsed);
      setPhase("done");

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 100);

    } catch (e) {
      clearInterval(phaseTimer);
      setError(e.message || "Something went wrong.");
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  }, [rawInput]);

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'Outfit', sans-serif", background: T.bg,
      minHeight:"100vh", color: T.text, padding:"0 0 4rem" }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500;600&family=Outfit:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: ${T.tealDim}; color: #fff; }
        textarea:focus { outline: none; }
        button:active { transform: scale(0.98); }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fadein { animation: fadein 0.4s ease forwards; }
        .section-fade { animation: fadein 0.5s ease both; }
      `}</style>

      {/* NAV */}
      <nav style={{ borderBottom:`0.5px solid ${T.border}`, padding:"0 2rem",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        height:52, position:"sticky", top:0, zIndex:10, background: T.bg }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:7, height:7, borderRadius:"50%",
            background: T.teal, boxShadow:`0 0 8px ${T.teal}` }} />
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11,
            letterSpacing:"0.12em", textTransform:"uppercase", color: T.textMuted }}>
            Agent 03 · Client Reporting Intelligence
          </span>
        </div>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10,
          color: T.textHint, letterSpacing:"0.08em" }}>
          Epoch Frameworks LLC
        </span>
      </nav>

      {/* HERO */}
      <div style={{ maxWidth:780, margin:"0 auto", padding:"3.5rem 2rem 2rem" }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:"0.14em",
          textTransform:"uppercase", color: T.textMuted, marginBottom:"1rem",
          display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ display:"inline-block", width:20, height:1,
            background: T.textMuted }} />
          TCP Commerce · Intelligence Layer
        </div>
        <h1 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"clamp(28px,5vw,46px)",
          fontWeight:400, lineHeight:1.1, marginBottom:"1rem", color: T.text }}>
          Client Reporting<br />
          <em style={{ color: T.teal }}>Intelligence Agent</em>
        </h1>
        <p style={{ fontSize:15, color: T.textMuted, lineHeight:1.7, maxWidth:500,
          fontWeight:300 }}>
          Paste any raw marketplace data — Amazon exports, Shopify summaries,
          copy-pasted reports, CSV dumps. The agent returns an executive
          intelligence brief, anomaly stack, and prioritized action list.
        </p>
      </div>

      {/* INPUT PANEL */}
      <div style={{ maxWidth:780, margin:"0 auto", padding:"0 2rem" }}>
        <div style={{ background: T.bgCard, border:`0.5px solid ${T.border}`,
          borderRadius:16, overflow:"hidden" }}>

          {/* Input header */}
          <div style={{ padding:"14px 18px", borderBottom:`0.5px solid ${T.border}`,
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10,
              letterSpacing:"0.12em", textTransform:"uppercase", color: T.textMuted }}>
              Raw data input
            </span>
            <button onClick={loadSample}
              style={{ fontFamily:"'DM Mono',monospace", fontSize:10,
                letterSpacing:"0.08em", padding:"4px 12px", borderRadius:5,
                background: T.tealBg, border:`0.5px solid ${T.tealDim}`,
                color: T.teal, cursor:"pointer", transition:"opacity 0.15s" }}
              onMouseEnter={e => e.target.style.opacity=0.7}
              onMouseLeave={e => e.target.style.opacity=1}>
              Load sample data
            </button>
          </div>

          <textarea
            value={rawInput}
            onChange={e => setRawInput(e.target.value)}
            placeholder={`Paste your raw client data here.\n\nWorks with:\n• Amazon Seller Central exports\n• Shopify performance summaries\n• Copy-pasted weekly reports\n• CSV data (any format)\n• Account manager notes\n• Any messy marketplace output\n\nOr click "Load sample data" to see a demo.`}
            style={{ width:"100%", minHeight:240, background: T.bgInput,
              border:"none", color: T.text, fontSize:13, lineHeight:1.7,
              padding:"18px", fontFamily:"'DM Mono',monospace", resize:"vertical",
              letterSpacing:"0.01em" }}
          />

          <div style={{ padding:"14px 18px", borderTop:`0.5px solid ${T.border}`,
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:12, color: T.textHint }}>
              {rawInput.length > 0 ? `${rawInput.length} characters · ready to process` : "No data yet"}
            </span>
            <button onClick={runAgent} disabled={loading || !rawInput.trim()}
              style={{ display:"flex", alignItems:"center", gap:8,
                padding:"9px 22px", borderRadius:8, cursor: loading ? "default" : "pointer",
                background: loading ? T.bgElevate : T.teal,
                color: loading ? T.textMuted : "#0D0D0C",
                border:"none", fontSize:13, fontWeight:600,
                fontFamily:"'DM Mono',monospace", letterSpacing:"0.06em",
                transition:"all 0.2s", opacity: !rawInput.trim() ? 0.4 : 1 }}>
              {loading ? (
                <>
                  <span style={{ display:"inline-block", width:8, height:8,
                    borderRadius:"50%", background: T.teal,
                    animation:"pulse 1s infinite" }} />
                  PROCESSING
                </>
              ) : "RUN AGENT →"}
            </button>
          </div>
        </div>

        {/* Phase indicator */}
        {phase === "processing" && (
          <div style={{ marginTop:12, padding:"10px 16px",
            background: T.tealBg, border:`0.5px solid ${T.tealDim}`,
            borderRadius:8, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ display:"inline-block", width:6, height:6,
              borderRadius:"50%", background: T.teal,
              animation:"pulse 0.8s infinite" }} />
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11,
              color: T.teal, letterSpacing:"0.08em" }}>{phaseMsg}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop:12, padding:"12px 16px",
            background: T.redBg, border:`0.5px solid ${T.red}40`,
            borderRadius:8, color: T.red, fontSize:13, fontFamily:"'DM Mono',monospace" }}>
            Error: {error}
          </div>
        )}
      </div>

      {/* ── REPORT OUTPUT ───────────────────────────────────────────────────── */}
      {report && (
        <div ref={resultRef} style={{ maxWidth:780, margin:"2rem auto 0",
          padding:"0 2rem" }} className="fadein">

          {/* Report header */}
          <div style={{ background: T.bgCard, border:`0.5px solid ${T.borderMid}`,
            borderRadius:16, padding:"1.5rem", marginBottom:12,
            borderTop:`2px solid ${T.teal}` }}>
            <div style={{ display:"flex", alignItems:"flex-start",
              justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10,
                  letterSpacing:"0.14em", textTransform:"uppercase",
                  color: T.textMuted, marginBottom:6 }}>
                  Intelligence Brief · {report.reportPeriod}
                </div>
                <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:28,
                  fontWeight:400, color: T.text, marginBottom:10 }}>
                  {report.clientName}
                </h2>
                <p style={{ fontSize:14, color: T.textMuted, lineHeight:1.7,
                  maxWidth:480, fontWeight:300 }}>
                  {report.executiveSummary}
                </p>
              </div>
              <div style={{ textAlign:"center", flexShrink:0 }}>
                <ScoreRing score={report.performanceScore} />
                <div style={{ fontSize:11, color: T.textMuted, marginTop:4,
                  fontFamily:"'DM Mono',monospace", maxWidth:120 }}>
                  {report.scoreRationale}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          {report.metrics?.length > 0 && (
            <div className="section-fade" style={{ marginBottom:12 }}>
              <SectionLabel>Performance metrics</SectionLabel>
              <div style={{ display:"grid",
                gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:8 }}>
                {report.metrics.map((m, i) => <MetricCard key={i} m={m} />)}
              </div>
            </div>
          )}

          {/* Trend analysis */}
          {report.trendAnalysis?.length > 0 && (
            <div className="section-fade" style={{ marginBottom:12 }}>
              <SectionLabel>Trend analysis</SectionLabel>
              <div style={{ background: T.bgCard, border:`0.5px solid ${T.border}`,
                borderRadius:12, overflow:"hidden" }}>
                {report.trendAnalysis.map((tr, i) => (
                  <div key={i} style={{ padding:"16px 18px",
                    borderBottom: i < report.trendAnalysis.length - 1
                      ? `0.5px solid ${T.border}` : "none" }}>
                    <div style={{ fontSize:13, fontWeight:500, color: T.text,
                      marginBottom:5 }}>{tr.title}</div>
                    <div style={{ fontSize:13, color: T.textMuted,
                      lineHeight:1.65, fontWeight:300 }}>{tr.body}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anomalies */}
          {report.anomalies?.length > 0 && (
            <div className="section-fade" style={{ marginBottom:12 }}>
              <SectionLabel>Anomaly detection</SectionLabel>
              <div style={{ background: T.bgCard, border:`0.5px solid ${T.border}`,
                borderRadius:12, padding:"0 18px" }}>
                {report.anomalies.map((a, i) => (
                  <AnomalyRow key={i} a={a} />
                ))}
              </div>
            </div>
          )}

          {/* Action stack */}
          {report.actionStack?.length > 0 && (
            <div className="section-fade" style={{ marginBottom:12 }}>
              <SectionLabel>Action stack</SectionLabel>
              <div style={{ background: T.bgCard, border:`0.5px solid ${T.border}`,
                borderRadius:12, padding:"0 18px" }}>
                {report.actionStack.map((a, i) => (
                  <ActionRow key={i} a={a} />
                ))}
              </div>
            </div>
          )}

          {/* Client brief — copy-paste ready */}
          {report.clientBrief && (
            <div className="section-fade" style={{ marginBottom:12 }}>
              <SectionLabel>Client-facing brief</SectionLabel>
              <ClientBriefBlock text={report.clientBrief} />
            </div>
          )}

          {/* Reset */}
          <div style={{ textAlign:"center", marginTop:24 }}>
            <button onClick={() => { setReport(null); setPhase("idle"); setRawInput(""); }}
              style={{ fontFamily:"'DM Mono',monospace", fontSize:11,
                letterSpacing:"0.1em", padding:"8px 20px", borderRadius:6,
                background:"transparent", border:`0.5px solid ${T.border}`,
                color: T.textMuted, cursor:"pointer", transition:"all 0.15s" }}
              onMouseEnter={e => { e.target.style.borderColor = T.borderMid; e.target.style.color = T.text; }}
              onMouseLeave={e => { e.target.style.borderColor = T.border; e.target.style.color = T.textMuted; }}>
              ↩ Run new report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SMALL HELPERS ────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10,
      letterSpacing:"0.14em", textTransform:"uppercase", color: T.textHint,
      marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
      {children}
      <span style={{ flex:1, height:"0.5px", background: T.border, display:"block" }} />
    </div>
  );
}

function ClientBriefBlock({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div style={{ background: T.bgCard, border:`0.5px solid ${T.border}`,
      borderRadius:12, overflow:"hidden",
      borderLeft:`3px solid ${T.teal}` }}>
      <div style={{ padding:"14px 18px", borderBottom:`0.5px solid ${T.border}`,
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10,
          letterSpacing:"0.1em", textTransform:"uppercase", color: T.textMuted }}>
          Ready for client email
        </span>
        <button onClick={copy}
          style={{ fontFamily:"'DM Mono',monospace", fontSize:10,
            letterSpacing:"0.08em", padding:"4px 12px", borderRadius:5,
            background: copied ? T.tealBg : "transparent",
            border:`0.5px solid ${copied ? T.teal : T.border}`,
            color: copied ? T.teal : T.textMuted, cursor:"pointer",
            transition:"all 0.2s" }}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <div style={{ padding:"18px", fontSize:14, lineHeight:1.8,
        color: T.text, fontStyle:"italic",
        fontFamily:"'DM Serif Display',serif" }}>
        {text}
      </div>
    </div>
  );
}
