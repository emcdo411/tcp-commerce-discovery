import { useState, useRef, useCallback } from "react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const T = {
  bg: "#0D0D0C",
  bgCard: "#141413",
  bgElevate: "#1C1C1A",
  bgInput: "#181817",
  border: "rgba(255,255,255,0.07)",
  borderMid: "rgba(255,255,255,0.13)",
  borderHi: "rgba(255,255,255,0.22)",
  text: "#E8E8E3",
  textMuted: "#7A7A74",
  textHint: "#4A4A46",
  teal: "#3ECFA0",
  tealDim: "#1D7A5F",
  tealBg: "rgba(62,207,160,0.08)",
  amber: "#F0A429",
  amberBg: "rgba(240,164,41,0.08)",
  red: "#E05252",
  redBg: "rgba(224,82,82,0.08)",
  blue: "#5B9CF6",
  blueBg: "rgba(91,156,246,0.08)",
};

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the Client Reporting Intelligence Agent — an elite e-commerce analytics advisor for TCP Commerce.

Your job: transform raw, messy marketplace data such as CSVs, copy-pasted reports, screenshots described in text, Amazon Seller Central exports, Shopify summaries, or any client performance data into a polished executive intelligence brief.

CRITICAL OUTPUT RULES:
- Respond with valid parseable JSON only.
- Do not include markdown fences.
- Do not include comments.
- Do not include preamble or explanation outside JSON.
- Do not truncate.
- Ensure every string is closed.
- Ensure every object and array is fully closed.
- Escape all internal quotes inside strings.
- Use only double quotes for JSON keys and string values.
- The response must be directly parseable by JSON.parse().

Return exactly this JSON structure:
{
  "clientName": "inferred client or brand name, or Client if unknown",
  "reportPeriod": "inferred time period or Recent Period",
  "executiveSummary": "2-3 sentence executive summary. Direct, confident, no fluff. What is the headline story?",
  "performanceScore": 0,
  "scoreRationale": "one sentence explaining the score",
  "metrics": [
    {
      "label": "metric name",
      "value": "formatted value such as $142300 or 3.8% or 1204 units",
      "trend": "up",
      "trendPct": "+12%",
      "status": "good",
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
      "severity": "high",
      "title": "anomaly title",
      "detail": "what is unusual and why it matters"
    }
  ],
  "actionStack": [
    {
      "priority": 1,
      "horizon": "immediate",
      "action": "specific actionable recommendation, not vague",
      "rationale": "why this action, why now"
    }
  ],
  "clientBrief": "The client-facing paragraph. Polished, confident, no jargon. 3-4 sentences. This is what gets copy-pasted into the client email."
}

Allowed values:
- metrics.trend must be one of: up, down, flat
- metrics.status must be one of: good, warning, critical, neutral
- anomalies.severity must be one of: high, medium, low
- actionStack.horizon must be one of: immediate, this week, this month

Rules:
- Extract every number you can find and put it in metrics.
- If data is thin, still produce a full brief with what you have and note limitations.
- actionStack must have 3-5 items, ordered by priority.
- anomalies must identify at least 1 and at most 4.
- trendAnalysis must include 2-4 trend items.
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

const DEMO_REPORT = {
  clientName: "BrightHome Essentials",
  reportPeriod: "Week of May 5-11, 2026",
  executiveSummary: "BrightHome Essentials remains healthy year over year, with revenue up 44.3% versus the same week last year, but weekly momentum softened by 9.9%. The account needs immediate attention on Bamboo Cutting Board inventory coverage, Ceramic Knife Set underperformance, and PPC efficiency as ACOS sits above target.",
  performanceScore: 71,
  scoreRationale: "Strong annual growth and account health are offset by short-term revenue decline, elevated ACOS, and inventory risk on the top product.",
  metrics: [
    { label: "Total Revenue", value: "$38,420", trend: "down", trendPct: "-9.9%", status: "warning", note: "Revenue declined week over week despite remaining materially above last year." },
    { label: "Year-over-Year Revenue", value: "+$11,800", trend: "up", trendPct: "+44.3%", status: "good", note: "The account is still significantly stronger than the same week last year." },
    { label: "Units Sold", value: "1,847", trend: "flat", trendPct: "n/a", status: "neutral", note: "Volume remains meaningful, but product-level mix needs attention." },
    { label: "PPC Spend", value: "$3,840", trend: "flat", trendPct: "n/a", status: "warning", note: "Ad spend is meaningful while ACOS is above target." },
    { label: "ACOS", value: "28.4%", trend: "up", trendPct: "+6.4 pts vs target", status: "warning", note: "ACOS is materially above the 22% target and should be tightened." },
    { label: "Conversion Rate", value: "8.2%", trend: "flat", trendPct: "n/a", status: "neutral", note: "Conversion is usable but should be checked by ASIN and traffic source." },
    { label: "Buy Box", value: "91.3%", trend: "flat", trendPct: "n/a", status: "good", note: "Buy Box control is strong and supports continued sales efficiency." },
    { label: "Bamboo Board Inventory", value: "142 units", trend: "down", trendPct: "6.5 days coverage", status: "critical", note: "Top product inventory is approaching a stockout window." },
  ],
  trendAnalysis: [
    { title: "Revenue softened short term while annual growth remains strong", body: "Revenue fell $4,210 week over week, a 9.9% decline, but remains up $11,800 versus the same week last year. This suggests the account is not structurally weak, but the current week requires tactical correction." },
    { title: "Top products are carrying the account", body: "The Bamboo Cutting Board Set, Silicone Spatula Set, and Stainless Steel Mixing Bowls produced $21,070 combined revenue. Protecting inventory and ad efficiency around these products should be the near-term priority." },
    { title: "PPC efficiency needs correction", body: "ACOS is 28.4% against a 22% target. Continued spend at this level may protect volume, but margin leakage will increase unless bids, terms, or product allocation are adjusted." },
  ],
  anomalies: [
    { severity: "high", title: "Bamboo Cutting Board inventory risk", detail: "Only 142 units remain, equal to roughly 6.5 days of coverage at current velocity. This is the highest-priority operational risk because it threatens the strongest revenue driver." },
    { severity: "medium", title: "Ceramic Knife Set performance collapse", detail: "The Ceramic Knife Set generated only $420 on 12 units while BSR dropped from #340 to #892. PPC should be reviewed before additional spend is pushed into weak demand." },
    { severity: "medium", title: "Bamboo Spoon Set quality signal", detail: "The Bamboo Spoon Set produced only $180 and received 3 returns and 2 negative reviews. That combination suggests a conversion and reputation risk." },
    { severity: "low", title: "Competitor price move", detail: "KitchenPro reduced Bamboo Board pricing by 15%, creating potential pressure on ranking, conversion, and buy-box economics." },
  ],
  actionStack: [
    { priority: 1, horizon: "immediate", action: "Replenish or protect Bamboo Cutting Board inventory", rationale: "The product has only 6.5 days of coverage and is the largest revenue contributor in the report." },
    { priority: 2, horizon: "immediate", action: "Reduce or pause PPC on Ceramic Knife Set pending review", rationale: "Low sales, poor BSR movement, and weak velocity make continued spend inefficient." },
    { priority: 3, horizon: "this week", action: "Audit PPC terms driving elevated ACOS", rationale: "ACOS is 28.4% versus a 22% target, creating margin leakage that can be corrected through bid and keyword refinement." },
    { priority: 4, horizon: "this week", action: "Review Bamboo Spoon Set return and negative review causes", rationale: "The product is showing early quality or expectation-mismatch signals that could damage conversion." },
    { priority: 5, horizon: "this month", action: "Prepare Mother's Day traffic plan for top kitchen SKUs", rationale: "Expected demand spike should be routed toward products with inventory depth and stronger conversion economics." },
  ],
  clientBrief: "BrightHome Essentials remains in a strong year-over-year position, with revenue up 44.3% compared to the same week last year, but this week shows several operational issues that need attention. The largest priority is protecting Bamboo Cutting Board inventory, which has only 6.5 days of estimated coverage remaining. We also recommend tightening PPC efficiency, especially with ACOS running above target, and reviewing underperforming SKUs before additional ad spend is committed.",
};

const STRESS_REPORT = {
  clientName: "IronForge Athletics",
  reportPeriod: "April 28 - May 11, 2026",
  executiveSummary: "IronForge Athletics is producing strong top-line volume, but the growth quality is deteriorating across fulfillment, margin, refunds, ad efficiency, and customer sentiment. The account should not accelerate paid growth until inventory, 3PL reliability, refund drivers, and discount cadence are stabilized.",
  performanceScore: 46,
  scoreRationale: "Revenue volume is strong, but operational instability, margin compression, refund spikes, and inventory imbalance create a high-risk growth profile.",
  metrics: [
    { label: "Shopify Gross Sales", value: "$284,992", trend: "up", trendPct: "n/a", status: "good", note: "Shopify is driving meaningful revenue, but discounting and returns reduce quality." },
    { label: "Shopify Net Sales", value: "$231,184", trend: "flat", trendPct: "n/a", status: "warning", note: "Net sales are materially lower after discounts and returns." },
    { label: "Discounts", value: "-$41,220", trend: "up", trendPct: "n/a", status: "warning", note: "Discounting is large enough to raise brand and margin concerns." },
    { label: "Amazon Revenue", value: "$198,443", trend: "up", trendPct: "n/a", status: "good", note: "Amazon remains a major channel, but efficiency and refund signals are weak." },
    { label: "Amazon ACOS", value: "34.9%", trend: "up", trendPct: "n/a", status: "critical", note: "ACOS is elevated and suggests paid growth may be buying inefficient revenue." },
    { label: "Refund Rate", value: "11.2%", trend: "up", trendPct: "n/a", status: "critical", note: "Refund pressure is high and tied to packaging, flavor, and fill complaints." },
    { label: "3PL Error Rate", value: "8.2%", trend: "up", trendPct: "n/a", status: "critical", note: "Fulfillment error rates are high enough to damage growth, retention, and support load." },
    { label: "Support Tickets", value: "1,882", trend: "up", trendPct: "+44% WoW", status: "critical", note: "Support volume indicates operational drag is reaching the customer experience." },
    { label: "Gross Margin", value: "54%", trend: "down", trendPct: "-7 pts", status: "warning", note: "Margin compressed from 61% to 54%, likely from discounting, ads, returns, and operations." },
    { label: "PreWorkout Inventory", value: "5.1 days", trend: "down", trendPct: "n/a", status: "critical", note: "Top Amazon product is close to stockout despite strong demand." },
    { label: "Creatine Coverage", value: "214 days", trend: "flat", trendPct: "n/a", status: "warning", note: "Creatine is heavily overstocked while core demand product is at risk." },
  ],
  trendAnalysis: [
    { title: "Revenue growth is outpacing operational readiness", body: "Shopify and Amazon are producing strong volume, but shipping delays, damaged packaging, support tickets, and refund pressure show the operating system is under strain. Scaling demand further before stabilizing fulfillment will likely worsen customer experience." },
    { title: "Paid growth is becoming inefficient", body: "Amazon ACOS sits at 34.9%, PPC spend is $68,882, and a Slack note states the team feels like it is buying revenue. This combination suggests the growth engine is generating volume but not clean margin quality." },
    { title: "Inventory is misallocated", body: "The PreWorkout SKU has only 5.1 days of coverage while Creatine has 214 days of coverage. This creates a dual risk: stockout on a winner and trapped cash in a slow-moving SKU." },
    { title: "Customer sentiment is becoming a brand risk", body: "Negative sentiment is 33%, support tickets rose 44% week over week, and complaints cluster around shipping, damaged packaging, wrong flavor, and missing scoop. The brand should treat this as a retention and reputation risk, not only a support issue." },
  ],
  anomalies: [
    { severity: "high", title: "Growth quality degradation", detail: "Top-line revenue looks strong, but margin compression, high ACOS, refund pressure, and operational complaints indicate the account may be scaling unhealthy demand." },
    { severity: "high", title: "Fulfillment instability", detail: "3PL error rate is 8.2%, fulfillment time increased from 2.8 to 5.4 days, and support tickets rose 44% week over week. This is a structural operating constraint." },
    { severity: "high", title: "Inventory asymmetry", detail: "PreWorkout is near stockout at 5.1 days of coverage while Creatine holds 214 days of coverage. The account has both shortage and overstock risk at the same time." },
    { severity: "medium", title: "Discount fatigue signal", detail: "The Flash Sale campaign had a 4.8% unsubscribe rate and internal notes suggest customers may be fatigued by discount cadence. This creates brand and list-health risk." },
  ],
  actionStack: [
    { priority: 1, horizon: "immediate", action: "Pause aggressive demand scaling until 3PL error rate and fulfillment time stabilize", rationale: "Operational failures are already showing up in support tickets, refunds, and customer sentiment." },
    { priority: 2, horizon: "immediate", action: "Protect PreWorkout inventory and reallocate growth toward SKUs with sufficient coverage", rationale: "The strongest demand SKU has only 5.1 days of coverage, creating immediate stockout risk." },
    { priority: 3, horizon: "this week", action: "Audit Amazon PPC spend and cut inefficient campaigns above acceptable ACOS", rationale: "ACOS at 34.9% and a team note about buying revenue indicate paid growth quality needs correction." },
    { priority: 4, horizon: "this week", action: "Investigate refund and complaint drivers tied to packaging, scoop consistency, and flavor concerns", rationale: "Refunds and negative reviews are pointing to correctable product or fulfillment issues." },
    { priority: 5, horizon: "this month", action: "Rebalance executive growth plan before investor roadshow", rationale: "CEO, COO, Growth, Operations, and Support are signaling conflicting priorities that need one operating plan." },
  ],
  clientBrief: "IronForge Athletics is generating strong revenue across Shopify and Amazon, but the current growth pattern is showing signs of operational strain. The most urgent issues are fulfillment instability, elevated refund pressure, high Amazon ACOS, and a near-term stockout risk on the PreWorkout SKU. We recommend stabilizing operations and inventory before increasing ad spend or influencer volume so the next growth push does not amplify customer experience problems.",
};

function getDemoReportForInput(input) {
  const normalized = String(input || "").toLowerCase();
  if (
    normalized.includes("ironforge") ||
    normalized.includes("preworkout") ||
    normalized.includes("3pl error") ||
    normalized.includes("dylanfit") ||
    normalized.includes("summer bulk stack")
  ) {
    return STRESS_REPORT;
  }
  return DEMO_REPORT;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const statusColor = (s) => ({
  good: T.teal,
  warning: T.amber,
  critical: T.red,
  neutral: T.textMuted,
}[s] || T.textMuted);

const statusBg = (s) => ({
  good: T.tealBg,
  warning: T.amberBg,
  critical: T.redBg,
  neutral: "transparent",
}[s] || "transparent");

const severityColor = (s) => ({
  high: T.red,
  medium: T.amber,
  low: T.textMuted,
}[s] || T.textMuted);

const horizonColor = (h) => ({
  immediate: T.red,
  "this week": T.amber,
  "this month": T.teal,
}[h] || T.textMuted);

const trendIcon = (t) => t === "up" ? "↑" : t === "down" ? "↓" : "→";
const trendCol = (t, s) => s === "critical" ? T.red : s === "warning" ? T.amber : t === "up" ? T.teal : t === "down" ? T.red : T.textMuted;

function extractJsonString(text) {
  const cleaned = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return cleaned;
  return cleaned.slice(start, end + 1);
}

function parseAgentJson(text) {
  const jsonCandidate = extractJsonString(text);
  try {
    return JSON.parse(jsonCandidate);
  } catch (firstErr) {
    console.error("Initial JSON parse failed. Raw candidate:", jsonCandidate);
    const repaired = jsonCandidate
      .replace(/[\u0000-\u001F]+/g, " ")
      .replace(/,\s*([}\]])/g, "$1")
      .trim();
    try {
      return JSON.parse(repaired);
    } catch (secondErr) {
      console.error("Repair parse failed. Repaired candidate:", repaired);
      throw firstErr;
    }
  }
}

function validateReport(r) {
  return {
    clientName: r?.clientName || "Client",
    reportPeriod: r?.reportPeriod || "Recent Period",
    executiveSummary: r?.executiveSummary || "The available data shows enough signal to produce a directional performance read, but additional source detail would improve the confidence level.",
    performanceScore: Number.isFinite(Number(r?.performanceScore)) ? Math.max(0, Math.min(100, Number(r.performanceScore))) : 50,
    scoreRationale: r?.scoreRationale || "Score reflects available data quality and visible performance signals.",
    metrics: Array.isArray(r?.metrics) ? r.metrics : [],
    trendAnalysis: Array.isArray(r?.trendAnalysis) ? r.trendAnalysis : [],
    anomalies: Array.isArray(r?.anomalies) ? r.anomalies : [],
    actionStack: Array.isArray(r?.actionStack) ? r.actionStack : [],
    clientBrief: r?.clientBrief || "Based on the available data, the account shows enough performance signal to justify a focused review of trends, anomalies, and immediate action items.",
  };
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const r = 44, cx = 52, cy = 52;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const col = score >= 70 ? T.teal : score >= 45 ? T.amber : T.red;
  return (
    <svg width="104" height="104" style={{ display: "block" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.border} strokeWidth="6" />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={col} strokeWidth="6"
        strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fill={col}
        style={{ fontSize: 22, fontWeight: 600, fontFamily: "'DM Mono',monospace" }}>{score}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={T.textMuted}
        style={{ fontSize: 10, fontFamily: "'DM Mono',monospace" }}>/100</text>
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
      <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: T.textMuted,
        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{m.label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 20, fontWeight: 600, color: T.text, fontFamily: "'DM Mono',monospace" }}>{m.value}</span>
        <span style={{ fontSize: 12, color: trendCol(m.trend, m.status), fontFamily: "'DM Mono',monospace" }}>
          {trendIcon(m.trend)} {m.trendPct}
        </span>
      </div>
      <div style={{ fontSize: 11.5, color: T.textMuted, lineHeight: 1.5 }}>{m.note}</div>
      <div style={{ marginTop: 8, display: "inline-block", fontSize: 10, fontFamily: "'DM Mono',monospace",
        padding: "2px 8px", borderRadius: 4, background: statusBg(m.status),
        color: statusColor(m.status), border: `0.5px solid ${statusColor(m.status)}40` }}>
        {m.status}
      </div>
    </div>
  );
}

function AnomalyRow({ a }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 0",
      borderBottom: `0.5px solid ${T.border}`, alignItems: "flex-start" }}>
      <div style={{ marginTop: 2, width: 8, height: 8, borderRadius: "50%",
        background: severityColor(a.severity), flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{a.title}</span>
          <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace",
            color: severityColor(a.severity), letterSpacing: "0.08em" }}>
            {String(a.severity || "low").toUpperCase()}
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: T.textMuted, lineHeight: 1.55 }}>{a.detail}</div>
      </div>
    </div>
  );
}

function ActionRow({ a }) {
  const hCol = horizonColor(a.horizon);
  return (
    <div style={{ display: "flex", gap: 14, padding: "14px 0",
      borderBottom: `0.5px solid ${T.border}`, alignItems: "flex-start" }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 20, fontWeight: 600,
        color: T.borderHi, minWidth: 28, lineHeight: 1 }}>
        {String(a.priority || 1).padStart(2, "0")}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{a.action}</span>
          <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", padding: "2px 8px",
            borderRadius: 4, color: hCol,
            background: `${hCol}15`, border: `0.5px solid ${hCol}40`,
            whiteSpace: "nowrap" }}>{a.horizon}</span>
        </div>
        <div style={{ fontSize: 12.5, color: T.textMuted, lineHeight: 1.55 }}>{a.rationale}</div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
      letterSpacing: "0.14em", textTransform: "uppercase", color: T.textHint,
      marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
      {children}
      <span style={{ flex: 1, height: "0.5px", background: T.border, display: "block" }} />
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
    <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`,
      borderRadius: 12, overflow: "hidden",
      borderLeft: `3px solid ${T.teal}` }}>
      <div style={{ padding: "14px 18px", borderBottom: `0.5px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
          letterSpacing: "0.1em", textTransform: "uppercase", color: T.textMuted }}>
          Ready for client email
        </span>
        <button onClick={copy}
          style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
            letterSpacing: "0.08em", padding: "4px 12px", borderRadius: 5,
            background: copied ? T.tealBg : "transparent",
            border: `0.5px solid ${copied ? T.teal : T.border}`,
            color: copied ? T.teal : T.textMuted, cursor: "pointer",
            transition: "all 0.2s" }}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <div style={{ padding: "18px", fontSize: 14, lineHeight: 1.8,
        color: T.text, fontStyle: "italic",
        fontFamily: "'DM Serif Display',serif" }}>
        {text}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ClientReportingAgent() {
  const [rawInput, setRawInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [phaseMsg, setPhaseMsg] = useState("");
  const [mode, setMode] = useState("demo");
  const [rawResponse, setRawResponse] = useState("");
  const resultRef = useRef(null);

  const phases = [
    "Parsing marketplace data...",
    "Extracting performance signals...",
    "Detecting anomalies...",
    "Generating executive brief...",
    "Stacking action recommendations...",
  ];

  const loadSample = () => setRawInput(SAMPLE_DATA);

  const completeRun = useCallback((nextReport) => {
    setReport(validateReport(nextReport));
    setPhase("done");
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, []);

  const runDemoAgent = useCallback(async () => {
    if (!rawInput.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);
    setRawResponse("");
    setPhase("processing");

    let pi = 0;
    setPhaseMsg(phases[0]);
    const phaseTimer = setInterval(() => {
      pi = Math.min(pi + 1, phases.length - 1);
      setPhaseMsg(phases[pi]);
    }, 700);

    setTimeout(() => {
      clearInterval(phaseTimer);
      completeRun(getDemoReportForInput(rawInput));
      setLoading(false);
    }, 2200);
  }, [rawInput, completeRun]);

  const runLiveAgent = useCallback(async () => {
    if (!rawInput.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);
    setRawResponse("");
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
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 3500,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: rawInput }],
        }),
      });

      const data = await res.json();
      clearInterval(phaseTimer);

      if (!res.ok) throw new Error(data?.error?.message || "API error");

      const text = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");

      setRawResponse(text);
      const parsed = parseAgentJson(text);
      completeRun(parsed);
    } catch (e) {
      clearInterval(phaseTimer);
      setError(e.message || "Something went wrong. Demo mode is still available in this preview.");
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  }, [rawInput, completeRun]);

  const runAgent = mode === "live" ? runLiveAgent : runDemoAgent;

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: T.bg,
      minHeight: "100vh", color: T.text, padding: "0 0 4rem" }}>
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
      <nav style={{ borderBottom: `0.5px solid ${T.border}`, padding: "0 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 52, position: "sticky", top: 0, zIndex: 10, background: T.bg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%",
            background: T.teal, boxShadow: `0 0 8px ${T.teal}` }} />
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11,
            letterSpacing: "0.12em", textTransform: "uppercase", color: T.textMuted }}>
            Agent 03 · Client Reporting Intelligence
          </span>
        </div>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
          color: T.textHint, letterSpacing: "0.08em" }}>
          Epoch Frameworks LLC
        </span>
      </nav>

      {/* HEADER */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "3.5rem 2rem 2rem" }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: "0.14em",
          textTransform: "uppercase", color: T.textMuted, marginBottom: "1rem",
          display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "inline-block", width: 20, height: 1, background: T.textMuted }} />
          TCP Commerce · Intelligence Layer
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(28px,5vw,46px)",
          fontWeight: 400, lineHeight: 1.1, marginBottom: "1rem", color: T.text }}>
          Client Reporting<br />
          <em style={{ color: T.teal }}>Intelligence Agent</em>
        </h1>
        <p style={{ fontSize: 15, color: T.textMuted, lineHeight: 1.7, maxWidth: 560, fontWeight: 300 }}>
          Paste any raw marketplace data. The agent returns an executive intelligence brief, anomaly stack, and prioritized action list.
        </p>
      </div>

      {/* INPUT PANEL */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 2rem" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {["demo", "live"].map((m) => (
            <button key={m} onClick={() => setMode(m)}
              style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: "0.08em",
                textTransform: "uppercase", padding: "7px 12px", borderRadius: 6,
                background: mode === m ? T.tealBg : T.bgCard,
                color: mode === m ? T.teal : T.textMuted,
                border: `0.5px solid ${mode === m ? T.tealDim : T.border}`,
                cursor: "pointer" }}>
              {m === "demo" ? "Preview Demo Mode" : "Live API Mode"}
            </button>
          ))}
        </div>

        <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`,
          borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `0.5px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
              letterSpacing: "0.12em", textTransform: "uppercase", color: T.textMuted }}>
              Raw data input
            </span>
            <button onClick={loadSample}
              style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
                letterSpacing: "0.08em", padding: "4px 12px", borderRadius: 5,
                background: T.tealBg, border: `0.5px solid ${T.tealDim}`,
                color: T.teal, cursor: "pointer" }}>
              Load sample data
            </button>
          </div>

          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={`Paste your raw client data here.\n\nWorks with:\n• Amazon Seller Central exports\n• Shopify performance summaries\n• Copy-pasted weekly reports\n• CSV data in any format\n• Account manager notes\n• Any messy marketplace output\n\nOr click Load sample data to see a demo.`}
            style={{ width: "100%", minHeight: 240, background: T.bgInput,
              border: "none", color: T.text, fontSize: 13, lineHeight: 1.7,
              padding: "18px", fontFamily: "'DM Mono',monospace", resize: "vertical",
              letterSpacing: "0.01em" }}
          />

          <div style={{ padding: "14px 18px", borderTop: `0.5px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: T.textHint }}>
              {rawInput.length > 0 ? `${rawInput.length} characters · ready to process` : "No data yet"}
            </span>
            <button onClick={runAgent} disabled={loading || !rawInput.trim()}
              style={{ display: "flex", alignItems: "center", gap: 8,
                padding: "9px 22px", borderRadius: 8,
                cursor: loading || !rawInput.trim() ? "default" : "pointer",
                background: loading ? T.bgElevate : T.teal,
                color: loading ? T.textMuted : "#0D0D0C",
                border: "none", fontSize: 13, fontWeight: 600,
                fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em",
                opacity: !rawInput.trim() ? 0.4 : 1 }}>
              {loading ? (
                <>
                  <span style={{ display: "inline-block", width: 8, height: 8,
                    borderRadius: "50%", background: T.teal,
                    animation: "pulse 1s infinite" }} />
                  PROCESSING
                </>
              ) : mode === "live" ? "RUN LIVE API →" : "RUN PREVIEW DEMO →"}
            </button>
          </div>
        </div>

        {mode === "live" && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: T.amberBg,
            border: `0.5px solid ${T.amber}40`, borderRadius: 8,
            color: T.amber, fontSize: 12, fontFamily: "'DM Mono',monospace", lineHeight: 1.5 }}>
            Live API mode calls the Anthropic API directly from the browser. Demo Mode is available for local testing.
          </div>
        )}

        {phase === "processing" && (
          <div style={{ marginTop: 12, padding: "10px 16px",
            background: T.tealBg, border: `0.5px solid ${T.tealDim}`,
            borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-block", width: 6, height: 6,
              borderRadius: "50%", background: T.teal,
              animation: "pulse 0.8s infinite" }} />
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11,
              color: T.teal, letterSpacing: "0.08em" }}>{phaseMsg}</span>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 12, padding: "12px 16px",
            background: T.redBg, border: `0.5px solid ${T.red}40`,
            borderRadius: 8, color: T.red, fontSize: 13,
            fontFamily: "'DM Mono',monospace", lineHeight: 1.5 }}>
            Error: {error}
          </div>
        )}
      </div>

      {/* REPORT OUTPUT */}
      {report && (
        <div ref={resultRef} style={{ maxWidth: 780, margin: "2rem auto 0", padding: "0 2rem" }} className="fadein">

          {/* HEADER CARD */}
          <div style={{ background: T.bgCard, border: `0.5px solid ${T.borderMid}`,
            borderRadius: 16, padding: "1.5rem", marginBottom: 12,
            borderTop: `2px solid ${T.teal}` }}>
            <div style={{ display: "flex", alignItems: "flex-start",
              justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  color: T.textMuted, marginBottom: 6 }}>
                  Intelligence Brief · {report.reportPeriod}
                </div>
                <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28,
                  fontWeight: 400, color: T.text, marginBottom: 10 }}>
                  {report.clientName}
                </h2>
                <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.7,
                  maxWidth: 480, fontWeight: 300 }}>
                  {report.executiveSummary}
                </p>
              </div>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <ScoreRing score={report.performanceScore} />
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4,
                  fontFamily: "'DM Mono',monospace", maxWidth: 120 }}>
                  {report.scoreRationale}
                </div>
              </div>
            </div>
          </div>

          {/* METRICS */}
          {report.metrics?.length > 0 && (
            <div className="section-fade" style={{ marginBottom: 12 }}>
              <SectionLabel>Performance metrics</SectionLabel>
              <div style={{ display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 8 }}>
                {report.metrics.map((m, i) => <MetricCard key={i} m={m} />)}
              </div>
            </div>
          )}

          {/* TREND ANALYSIS */}
          {report.trendAnalysis?.length > 0 && (
            <div className="section-fade" style={{ marginBottom: 12 }}>
              <SectionLabel>Trend analysis</SectionLabel>
              <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`,
                borderRadius: 12, overflow: "hidden" }}>
                {report.trendAnalysis.map((tr, i) => (
                  <div key={i} style={{ padding: "16px 18px",
                    borderBottom: i < report.trendAnalysis.length - 1 ? `0.5px solid ${T.border}` : "none" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 6 }}>
                      {tr.title}
                    </div>
                    <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.65 }}>
                      {tr.body}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANOMALIES */}
          {report.anomalies?.length > 0 && (
            <div className="section-fade" style={{ marginBottom: 12 }}>
              <SectionLabel>Anomaly detection</SectionLabel>
              <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`,
                borderRadius: 12, padding: "4px 16px" }}>
                {report.anomalies.map((a, i) => <AnomalyRow key={i} a={a} />)}
              </div>
            </div>
          )}

          {/* ACTION STACK */}
          {report.actionStack?.length > 0 && (
            <div className="section-fade" style={{ marginBottom: 12 }}>
              <SectionLabel>Action stack</SectionLabel>
              <div style={{ background: T.bgCard, border: `0.5px solid ${T.border}`,
                borderRadius: 12, padding: "4px 16px" }}>
                {report.actionStack.map((a, i) => <ActionRow key={i} a={a} />)}
              </div>
            </div>
          )}

          {/* CLIENT BRIEF */}
          {report.clientBrief && (
            <div className="section-fade" style={{ marginBottom: 12 }}>
              <SectionLabel>Client brief</SectionLabel>
              <ClientBriefBlock text={report.clientBrief} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
