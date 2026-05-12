import React, { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, AreaChart, Area, ComposedChart, Bar } from "recharts";

const T = {
  bg: "#0D0D0C",
  bgCard: "#141413",
  bgElevate: "#1C1C1A",
  bgInput: "#181817",
  border: "rgba(255,255,255,0.08)",
  borderMid: "rgba(255,255,255,0.14)",
  text: "#E8E8E3",
  textMuted: "#8A8A84",
  textHint: "#565650",
  teal: "#3ECFA0",
  blue: "#5B9CF6",
  amber: "#F0A429",
  red: "#E05252",
  greenBg: "rgba(62,207,160,0.08)",
  blueBg: "rgba(91,156,246,0.08)",
  amberBg: "rgba(240,164,41,0.08)",
  redBg: "rgba(224,82,82,0.08)",
};

const SAMPLE_DATA = `TCP Commerce Competitive Signal Pull
Client: BrightHome Essentials
Category: Kitchen Tools / Bamboo Cutting Boards
Window: May 1 - May 14, 2026

CLIENT SKU: Bamboo Cutting Board Set 3pc
Current Price: $38.99
Buy Box: 91.3%
Organic Rank: #142 Kitchen
Inventory Coverage: 6.5 days
Conversion Rate: 8.2%
ACOS: 28.4%

COMPETITOR: KitchenPro
May 1 Price: $42.99 | Rank: #188 | Rating: 4.4 | Reviews: 1,842
May 4 Price: $42.99 | Rank: #176
May 7 Price: $39.99 | Rank: #151
May 10 Price: $36.49 | Rank: #118 | Coupon: 10%
May 14 Price: $36.49 | Rank: #103 | Buy Box pressure increased

COMPETITOR: ChefCraft Plus
May 1 Price: $41.50 | Rank: #221 | Rating: 4.6 | Reviews: 968
May 4 Price: $40.99 | Rank: #207
May 7 Price: $40.99 | Rank: #190
May 10 Price: $39.50 | Rank: #174
May 14 Price: $39.50 | Rank: #162

COMPETITOR: HomeEdge
May 1 Price: $35.99 | Rank: #132 | Rating: 4.2 | Reviews: 3,104
May 4 Price: $35.99 | Rank: #135
May 7 Price: $35.99 | Rank: #141
May 10 Price: $35.99 | Rank: #148
May 14 Price: $35.99 | Rank: #156

ACCOUNT MANAGER NOTES:
KitchenPro dropped price sharply and appears to be gaining rank quickly.
Client inventory is low, so price matching may increase stockout risk.
Need to decide whether to defend price, protect margin, or conserve inventory until replenishment.
Mother's Day demand spike may temporarily mask competitive pressure.`;

const DEMO = {
  clientName: "BrightHome Essentials",
  category: "Kitchen Tools / Bamboo Cutting Boards",
  window: "May 1 - May 14, 2026",
  executiveSummary: "KitchenPro created the primary competitive threat by reducing price from $42.99 to $36.49 while improving rank from #188 to #103. BrightHome still holds strong Buy Box control at 91.3%, but low inventory coverage limits the ability to respond aggressively with price defense.",
  threatScore: 78,
  verdict: "High competitive pressure with constrained response options",
  chartData: [
    { date: "May 1", brightHomeRank: 142, kitchenProRank: 188, chefCraftRank: 221, homeEdgeRank: 132, kitchenProPrice: 42.99, brightHomePrice: 38.99 },
    { date: "May 4", brightHomeRank: 145, kitchenProRank: 176, chefCraftRank: 207, homeEdgeRank: 135, kitchenProPrice: 42.99, brightHomePrice: 38.99 },
    { date: "May 7", brightHomeRank: 148, kitchenProRank: 151, chefCraftRank: 190, homeEdgeRank: 141, kitchenProPrice: 39.99, brightHomePrice: 38.99 },
    { date: "May 10", brightHomeRank: 146, kitchenProRank: 118, chefCraftRank: 174, homeEdgeRank: 148, kitchenProPrice: 36.49, brightHomePrice: 38.99 },
    { date: "May 14", brightHomeRank: 142, kitchenProRank: 103, chefCraftRank: 162, homeEdgeRank: 156, kitchenProPrice: 36.49, brightHomePrice: 38.99 },
  ],
  signals: [
    { label: "KitchenPro price move", value: "-15.1%", status: "critical", note: "Price dropped from $42.99 to $36.49 while rank improved rapidly." },
    { label: "KitchenPro rank gain", value: "+85 positions", status: "critical", note: "Rank moved from #188 to #103 across the window." },
    { label: "BrightHome Buy Box", value: "91.3%", status: "good", note: "Client still controls the buying surface, but this could erode if pressure continues." },
    { label: "Inventory coverage", value: "6.5 days", status: "warning", note: "Low inventory makes aggressive price defense risky." },
  ],
  anomalies: [
    "KitchenPro's price cut coincided with the sharpest rank improvement in the set.",
    "HomeEdge is cheaper but losing rank, which suggests price alone is not the full driver.",
    "BrightHome's low inventory means a demand spike could create stockout risk before competitive response options are fully tested.",
  ],
  actionStack: [
    { priority: 1, action: "Do not immediately match KitchenPro pricing", rationale: "Inventory coverage is only 6.5 days. Matching price could accelerate stockout and sacrifice margin." },
    { priority: 2, action: "Run a short-term coupon test instead of a full price cut", rationale: "A controlled coupon can defend conversion while preserving list price integrity." },
    { priority: 3, action: "Increase monitoring cadence for KitchenPro rank, couponing, and review velocity", rationale: "The competitor is moving quickly enough to justify daily monitoring until the spike stabilizes." },
    { priority: 4, action: "Prepare replenishment-tied defense plan", rationale: "Once inventory coverage improves, BrightHome can respond more aggressively without stockout risk." },
  ],
  clientBrief: "KitchenPro is now the primary competitive threat in the bamboo cutting board segment. Their price reduction from $42.99 to $36.49 coincided with a rank improvement from #188 to #103, which suggests the move is gaining marketplace traction. Because BrightHome has only 6.5 days of inventory coverage, we recommend avoiding a full price match and using a controlled coupon or targeted promotion until replenishment improves."
};

function parseDemo(input) {
  const normalized = String(input || "").toLowerCase();
  if (normalized.includes("kitchenpro") || normalized.includes("bamboo") || normalized.includes("cutting board")) return DEMO;
  return { ...DEMO, executiveSummary: "The input did not include enough competitor detail to generate a fully differentiated market read, so this preview is using the boardroom sample model. Add competitor price, rank, reviews, Buy Box, or ad movement to strengthen the analysis." };
}

function StatusPill({ status }) {
  const map = {
    good: [T.teal, T.greenBg],
    warning: [T.amber, T.amberBg],
    critical: [T.red, T.redBg],
    neutral: [T.textMuted, "transparent"],
  };
  const [color, bg] = map[status] || map.neutral;
  return <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color, background: bg, border: `1px solid ${color}55`, padding: "4px 8px", borderRadius: 999, textTransform: "uppercase" }}>{status}</span>;
}

function SignalCard({ signal }) {
  return (
    <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.textHint, letterSpacing: "0.1em", textTransform: "uppercase" }}>{signal.label}</div>
        <StatusPill status={signal.status} />
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: signal.status === "critical" ? T.red : signal.status === "warning" ? T.amber : T.teal, lineHeight: 1 }}>{signal.value}</div>
      <p style={{ color: T.textMuted, fontSize: 13, lineHeight: 1.55, marginTop: 10 }}>{signal.note}</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label, mode }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  return (
    <div style={{
      background: "rgba(13,13,12,0.96)",
      border: `1px solid ${T.borderMid}`,
      borderRadius: 14,
      padding: 14,
      boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
      minWidth: 230,
    }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.blue, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
      {mode === "rank" ? (
        <div style={{ display: "grid", gap: 7 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}><span style={{ color: T.teal }}>BrightHome</span><strong style={{ color: T.text }}>#{row.brightHomeRank}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}><span style={{ color: T.red }}>KitchenPro</span><strong style={{ color: T.text }}>#{row.kitchenProRank}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}><span style={{ color: T.amber }}>ChefCraft Plus</span><strong style={{ color: T.text }}>#{row.chefCraftRank}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}><span style={{ color: T.blue }}>HomeEdge</span><strong style={{ color: T.text }}>#{row.homeEdgeRank}</strong></div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}`, color: T.textMuted, fontSize: 12 }}>
            KitchenPro price: <strong style={{ color: T.red }}>${row.kitchenProPrice}</strong> · BrightHome price: <strong style={{ color: T.teal }}>${row.brightHomePrice}</strong>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 7 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}><span style={{ color: T.red }}>KitchenPro price</span><strong style={{ color: T.text }}>${row.kitchenProPrice}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}><span style={{ color: T.teal }}>BrightHome price</span><strong style={{ color: T.text }}>${row.brightHomePrice}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}><span style={{ color: T.amber }}>Price gap</span><strong style={{ color: T.text }}>{row.priceGap > 0 ? "+" : ""}${row.priceGap?.toFixed?.(2)}</strong></div>
        </div>
      )}
    </div>
  );
}

function BoardroomChart({ data }) {
  const [mode, setMode] = useState("rank");
  const chartData = data.map((d) => ({
    ...d,
    priceGap: Number((d.brightHomePrice - d.kitchenProPrice).toFixed(2)),
    rankSpread: d.kitchenProRank - d.brightHomeRank,
    pressure: Math.max(0, Math.min(100, Math.round(((d.brightHomePrice - d.kitchenProPrice) * 12) + ((d.brightHomeRank - d.kitchenProRank) * 0.65) + 45))),
  }));

  const start = chartData[0];
  const end = chartData[chartData.length - 1];
  const kitchenRankGain = start.kitchenProRank - end.kitchenProRank;
  const priceDrop = ((start.kitchenProPrice - end.kitchenProPrice) / start.kitchenProPrice) * 100;
  const finalGap = end.brightHomePrice - end.kitchenProPrice;

  const fredPanel = {
    background: "#10100F",
    border: `1px solid ${T.borderMid}`,
    borderRadius: 4,
    padding: 12,
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.025)",
  };

  return (
    <div style={{
      background: `linear-gradient(180deg, #161615 0%, #10100F 100%)`,
      border: `1px solid ${T.borderMid}`,
      borderRadius: 18,
      padding: 22,
      boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.blue, letterSpacing: "0.13em", textTransform: "uppercase", marginBottom: 6 }}>Boardroom Competitive Visual · FRED-style regime chart</div>
          <h2 style={{ fontSize: 26, lineHeight: 1.05, color: T.text, margin: 0, letterSpacing: "-0.05em" }}>KitchenPro pressure curve</h2>
          <p style={{ color: T.textMuted, fontSize: 13, lineHeight: 1.55, margin: "8px 0 0", maxWidth: 660 }}>Shaded zones show competitive regimes, similar to how FRED uses shaded periods to mark macro conditions. Threshold lines make the decision boundary visible without over-explaining the chart.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          {[
            ["rank", "Rank View"],
            ["price", "Price View"],
            ["pressure", "Pressure View"],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setMode(key)} style={{
              background: mode === key ? T.blueBg : "transparent",
              color: mode === key ? T.blue : T.textMuted,
              border: `1px solid ${mode === key ? T.blue + "66" : T.border}`,
              borderRadius: 999,
              padding: "7px 10px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              cursor: "pointer",
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 18 }}>
        <div style={{ background: "rgba(224,82,82,0.055)", border: `1px solid ${T.red}44`, borderRadius: 8, padding: 14 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.textHint, letterSpacing: "0.1em", textTransform: "uppercase" }}>KitchenPro Rank Gain</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: T.red, lineHeight: 1.1 }}>+{kitchenRankGain}</div>
          <div style={{ color: T.textMuted, fontSize: 12 }}>positions improved</div>
        </div>
        <div style={{ background: "rgba(240,164,41,0.055)", border: `1px solid ${T.amber}44`, borderRadius: 8, padding: 14 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.textHint, letterSpacing: "0.1em", textTransform: "uppercase" }}>Price Compression</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: T.amber, lineHeight: 1.1 }}>-{priceDrop.toFixed(1)}%</div>
          <div style={{ color: T.textMuted, fontSize: 12 }}>KitchenPro price cut</div>
        </div>
        <div style={{ background: "rgba(91,156,246,0.055)", border: `1px solid ${T.blue}44`, borderRadius: 8, padding: 14 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.textHint, letterSpacing: "0.1em", textTransform: "uppercase" }}>Final Price Gap</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: T.blue, lineHeight: 1.1 }}>${finalGap.toFixed(2)}</div>
          <div style={{ color: T.textMuted, fontSize: 12 }}>BrightHome premium</div>
        </div>
      </div>

      <div style={{ height: 390, ...fredPanel }}>
        <ResponsiveContainer width="100%" height="100%">
          {mode === "rank" ? (
            <LineChart data={chartData} margin={{ top: 22, right: 28, left: 4, bottom: 8 }}>
              <defs>
                <linearGradient id="kitchenRed" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={T.amber}/><stop offset="100%" stopColor={T.red}/></linearGradient>
                <linearGradient id="clientGreen" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={T.teal}/><stop offset="100%" stopColor={T.blue}/></linearGradient>
              </defs>
              <ReferenceArea x1="May 7" x2="May 14" fill="rgba(255,255,255,0.075)" strokeOpacity={0} />
              <ReferenceArea y1={80} y2={120} fill={T.red} fillOpacity={0.055} strokeOpacity={0} />
              <ReferenceArea y1={120} y2={160} fill={T.amber} fillOpacity={0.04} strokeOpacity={0} />
              <CartesianGrid stroke="rgba(255,255,255,0.115)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="date" stroke={T.textHint} tick={{ fill: T.textMuted, fontSize: 11 }} tickLine={{ stroke: T.borderMid }} axisLine={{ stroke: T.borderMid }} padding={{ left: 8, right: 8 }} />
              <YAxis reversed domain={[80, 240]} stroke={T.textHint} tick={{ fill: T.textMuted, fontSize: 11 }} tickLine={{ stroke: T.borderMid }} axisLine={{ stroke: T.borderMid }} label={{ value: "Organic rank, lower is better", angle: -90, position: "insideLeft", fill: T.textHint, fontSize: 11 }} />
              <Tooltip content={<CustomTooltip mode="rank" />} />
              <ReferenceLine y={120} stroke={T.red} strokeDasharray="6 4" strokeWidth={1.4} label={{ value: "danger zone", fill: T.red, fontSize: 11, position: "insideTopRight" }} />
              <ReferenceLine y={142} stroke={T.textHint} strokeDasharray="3 3" strokeWidth={1.2} label={{ value: "BrightHome baseline", fill: T.textMuted, fontSize: 11, position: "insideRight" }} />
              <ReferenceLine y={160} stroke={T.amber} strokeDasharray="6 4" strokeWidth={1.1} label={{ value: "watch threshold", fill: T.amber, fontSize: 11, position: "insideRight" }} />
              <ReferenceLine x="May 10" stroke={T.red} strokeDasharray="5 5" strokeWidth={1.4} label={{ value: "KitchenPro price cut", fill: T.red, fontSize: 11, position: "top" }} />
              <Line type="monotone" dataKey="brightHomeRank" name="BrightHome" stroke="url(#clientGreen)" strokeWidth={4} dot={{ r: 4, fill: T.teal }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="kitchenProRank" name="KitchenPro" stroke="url(#kitchenRed)" strokeWidth={4} dot={{ r: 4, fill: T.red }} activeDot={{ r: 7 }} />
              <Line type="monotone" dataKey="chefCraftRank" name="ChefCraft Plus" stroke={T.amber} strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="homeEdgeRank" name="HomeEdge" stroke={T.blue} strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} />
            </LineChart>
          ) : mode === "price" ? (
            <ComposedChart data={chartData} margin={{ top: 22, right: 28, left: 4, bottom: 8 }}>
              <ReferenceArea x1="May 7" x2="May 14" fill="rgba(255,255,255,0.075)" strokeOpacity={0} />
              <ReferenceArea yAxisId="price" y1={34} y2={37} fill={T.red} fillOpacity={0.05} strokeOpacity={0} />
              <CartesianGrid stroke="rgba(255,255,255,0.115)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="date" stroke={T.textHint} tick={{ fill: T.textMuted, fontSize: 11 }} tickLine={{ stroke: T.borderMid }} axisLine={{ stroke: T.borderMid }} padding={{ left: 8, right: 8 }} />
              <YAxis yAxisId="price" domain={[34, 44]} stroke={T.textHint} tick={{ fill: T.textMuted, fontSize: 11 }} tickFormatter={(v) => `$${v}`} tickLine={{ stroke: T.borderMid }} axisLine={{ stroke: T.borderMid }} />
              <YAxis yAxisId="gap" orientation="right" domain={[-1, 4]} stroke={T.textHint} tick={{ fill: T.textMuted, fontSize: 11 }} tickFormatter={(v) => `$${v}`} tickLine={{ stroke: T.borderMid }} axisLine={{ stroke: T.borderMid }} />
              <Tooltip content={<CustomTooltip mode="price" />} />
              <ReferenceLine yAxisId="price" y={38.99} stroke={T.textHint} strokeDasharray="3 3" strokeWidth={1.2} label={{ value: "BrightHome list", fill: T.textMuted, fontSize: 11, position: "insideRight" }} />
              <ReferenceLine yAxisId="price" y={36.49} stroke={T.red} strokeDasharray="6 4" strokeWidth={1.3} label={{ value: "KitchenPro floor", fill: T.red, fontSize: 11, position: "insideBottomRight" }} />
              <ReferenceLine x="May 10" stroke={T.red} strokeDasharray="5 5" strokeWidth={1.4} label={{ value: "price break", fill: T.red, fontSize: 11, position: "top" }} />
              <Bar yAxisId="gap" dataKey="priceGap" name="Price Gap" fill={T.amber} opacity={0.32} radius={[4, 4, 0, 0]} />
              <Line yAxisId="price" type="monotone" dataKey="brightHomePrice" name="BrightHome Price" stroke={T.teal} strokeWidth={4} dot={{ r: 4, fill: T.teal }} />
              <Line yAxisId="price" type="monotone" dataKey="kitchenProPrice" name="KitchenPro Price" stroke={T.red} strokeWidth={4} dot={{ r: 4, fill: T.red }} />
            </ComposedChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 22, right: 28, left: 4, bottom: 8 }}>
              <defs>
                <linearGradient id="pressureFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.red} stopOpacity={0.38}/><stop offset="100%" stopColor={T.red} stopOpacity={0.025}/></linearGradient>
              </defs>
              <ReferenceArea x1="May 7" x2="May 14" fill="rgba(255,255,255,0.075)" strokeOpacity={0} />
              <ReferenceArea y1={70} y2={100} fill={T.red} fillOpacity={0.055} strokeOpacity={0} />
              <ReferenceArea y1={50} y2={70} fill={T.amber} fillOpacity={0.045} strokeOpacity={0} />
              <CartesianGrid stroke="rgba(255,255,255,0.115)" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="date" stroke={T.textHint} tick={{ fill: T.textMuted, fontSize: 11 }} tickLine={{ stroke: T.borderMid }} axisLine={{ stroke: T.borderMid }} padding={{ left: 8, right: 8 }} />
              <YAxis domain={[0, 100]} stroke={T.textHint} tick={{ fill: T.textMuted, fontSize: 11 }} tickLine={{ stroke: T.borderMid }} axisLine={{ stroke: T.borderMid }} />
              <Tooltip contentStyle={{ background: "#111110", border: `1px solid ${T.borderMid}`, borderRadius: 12, color: T.text }} labelStyle={{ color: T.red }} />
              <ReferenceLine y={70} stroke={T.red} strokeDasharray="6 4" strokeWidth={1.3} label={{ value: "redline threshold", fill: T.red, fontSize: 11, position: "insideTopRight" }} />
              <ReferenceLine y={50} stroke={T.amber} strokeDasharray="6 4" strokeWidth={1.1} label={{ value: "watch threshold", fill: T.amber, fontSize: 11, position: "insideRight" }} />
              <Area type="monotone" dataKey="pressure" name="Competitive Pressure" stroke={T.red} strokeWidth={4} fill="url(#pressureFill)" dot={{ r: 4, fill: T.red }} activeDot={{ r: 7 }} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.textMuted, textTransform: "uppercase" }}>
          <span style={{ color: T.teal }}>● BrightHome</span>
          <span style={{ color: T.red }}>● KitchenPro</span>
          <span style={{ color: T.amber }}>● ChefCraft Plus</span>
          <span style={{ color: T.blue }}>● HomeEdge</span>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.textHint, fontSize: 10, textTransform: "uppercase" }}>Shaded band: competitive event window · threshold lines: decision regimes</div>
      </div>
    </div>
  );
}

export default function CompetitiveSignalAgent() {
  const [input, setInput] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadSample = () => setInput(SAMPLE_DATA);
  const runAgent = () => {
    if (!input.trim()) return;
    setLoading(true);
    setReport(null);
    setTimeout(() => {
      setReport(parseDemo(input));
      setLoading(false);
    }, 1400);
  };

  const scoreColor = useMemo(() => {
    const s = report?.threatScore ?? 0;
    return s >= 75 ? T.red : s >= 50 ? T.amber : T.teal;
  }, [report]);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Inter, system-ui, sans-serif", paddingBottom: 56 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        textarea:focus { outline: none; border-color: ${T.teal}; }
        button:active { transform: scale(0.98); }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade { animation: fade .45s ease both; }
      `}</style>

      <nav style={{ height: 56, borderBottom: `1px solid ${T.border}`, background: T.bg, position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 9, height: 9, borderRadius: 99, background: T.blue, boxShadow: `0 0 14px ${T.blue}` }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>Agent 02 · Competitive Signal Intelligence</span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.textHint, letterSpacing: "0.08em", textTransform: "uppercase" }}>Epoch Frameworks LLC</span>
      </nav>

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 24px 0" }}>
        <section style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 28, alignItems: "start" }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.blue, marginBottom: 14 }}>TCP Commerce · Marketplace Intelligence Layer</div>
            <h1 style={{ fontSize: "clamp(38px, 6vw, 72px)", lineHeight: 0.95, letterSpacing: "-0.07em", margin: "0 0 18px", color: T.text }}>Competitive Signal Agent</h1>
            <p style={{ color: T.textMuted, fontSize: 16, lineHeight: 1.7, maxWidth: 650, margin: 0 }}>Monitors pricing, rank movement, Buy Box pressure, competitor velocity, and marketplace compression. The boardroom output turns raw competitive movement into a clear decision: defend, hold, conserve inventory, or reposition.</p>
          </div>

          <div style={{ background: T.bgCard, border: `1px solid ${T.borderMid}`, borderRadius: 22, padding: 22 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.textHint, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Why this second</div>
            <p style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.65, margin: 0 }}>After reporting explains the account, competitive intelligence explains the market. This is the natural second agent because it creates client-facing urgency and gives TCP a reason to move from reporting to advisory intelligence.</p>
          </div>
        </section>

        <section style={{ marginTop: 28, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 18, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>Competitive data input</span>
            <button onClick={loadSample} style={{ background: T.blueBg, color: T.blue, border: `1px solid ${T.blue}55`, borderRadius: 7, padding: "7px 11px", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, cursor: "pointer" }}>Load sample data</button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste competitor price, rank, Buy Box, review velocity, coupon, advertising, or marketplace notes here."
            style={{ width: "100%", minHeight: 220, resize: "vertical", background: T.bgInput, color: T.text, border: "none", padding: 18, fontSize: 13, lineHeight: 1.65, fontFamily: "'JetBrains Mono', monospace" }}
          />
          <div style={{ padding: "14px 18px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <span style={{ color: T.textHint, fontSize: 12 }}>{input.length ? `${input.length} characters · ready to process` : "No competitive signal data yet"}</span>
            <button onClick={runAgent} disabled={loading || !input.trim()} style={{ background: loading ? T.bgElevate : T.blue, color: loading ? T.textMuted : "#06080D", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.07em", cursor: loading || !input.trim() ? "default" : "pointer", opacity: !input.trim() ? 0.45 : 1 }}>
              {loading ? "PROCESSING..." : "RUN SIGNAL AGENT →"}
            </button>
          </div>
        </section>

        {loading && (
          <div style={{ marginTop: 14, padding: "12px 16px", border: `1px solid ${T.blue}44`, background: T.blueBg, color: T.blue, borderRadius: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 99, background: T.blue, animation: "pulse 1s infinite", marginRight: 8 }} />
            Mapping competitive movement...
          </div>
        )}

        {report && (
          <section className="fade" style={{ marginTop: 30, display: "grid", gap: 16 }}>
            <div style={{ background: T.bgCard, border: `1px solid ${T.borderMid}`, borderRadius: 22, padding: 24, display: "grid", gridTemplateColumns: "1fr 150px", gap: 20, alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.textHint, fontSize: 10, letterSpacing: "0.13em", textTransform: "uppercase", marginBottom: 8 }}>{report.clientName} · {report.window}</div>
                <h2 style={{ margin: "0 0 10px", fontSize: 28, letterSpacing: "-0.05em" }}>{report.verdict}</h2>
                <p style={{ color: T.textMuted, lineHeight: 1.7, margin: 0 }}>{report.executiveSummary}</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 64, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{report.threatScore}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.textHint, fontSize: 10, textTransform: "uppercase" }}>Threat Score</div>
              </div>
            </div>

            <BoardroomChart data={report.chartData} />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {report.signals.map((s, i) => <SignalCard key={i} signal={s} />)}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 18, padding: 20 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.amber, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Anomalies</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: T.textMuted, lineHeight: 1.7, fontSize: 14 }}>
                  {report.anomalies.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
              <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 18, padding: 20 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.teal, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Action Stack</div>
                <div style={{ display: "grid", gap: 12 }}>
                  {report.actionStack.map((a) => (
                    <div key={a.priority} style={{ display: "flex", gap: 12 }}>
                      <div style={{ color: T.textHint, fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 800 }}>{String(a.priority).padStart(2, "0")}</div>
                      <div>
                        <div style={{ color: T.text, fontSize: 14, fontWeight: 700 }}>{a.action}</div>
                        <div style={{ color: T.textMuted, fontSize: 12.5, lineHeight: 1.5 }}>{a.rationale}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: T.greenBg, border: `1px solid ${T.teal}55`, borderRadius: 18, padding: 20 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.teal, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Client-facing brief</div>
              <p style={{ color: T.text, fontSize: 15, lineHeight: 1.75, margin: 0, fontStyle: "italic" }}>{report.clientBrief}</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
