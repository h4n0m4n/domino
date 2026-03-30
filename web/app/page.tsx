"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { scenarios, type ScenarioNode } from "./scenario-data";

const SECTOR: Record<string, { color: string; label: string }> = {
  security: { color: "#ff4444", label: "SEC" }, energy: { color: "#f0a030", label: "NRG" },
  food: { color: "#3fb950", label: "FOOD" }, transport: { color: "#58a6ff", label: "TRNS" },
  employment: { color: "#bc8cff", label: "JOBS" }, currency: { color: "#e3b341", label: "FX" },
  finance: { color: "#39d2c0", label: "FIN" }, health: { color: "#f778ba", label: "HLTH" },
  technology: { color: "#a78bfa", label: "TECH" }, housing: { color: "#da7756", label: "HOUS" },
};
const sc = (s: string) => SECTOR[s] || { color: "#8b949e", label: "?" };
const ACCENT: Record<string, string> = {
  hormuz_strait: "#ff4444", dollar_crisis: "#f0a030", ai_displacement: "#bc8cff",
  pandemic_v2: "#3fb950", taiwan_chips: "#22d3ee", climate_food: "#65a30d",
  turkey_earthquake: "#ea580c", crypto_crash: "#d946ef", energy_transition: "#10b981",
};
const KEYS = Object.keys(scenarios);

interface Profile { monthly_fuel_spend: number; monthly_energy_bill: number; monthly_groceries: number; monthly_rent: number; monthly_income: number; savings: number; }
const BMAP: Record<string, keyof Profile> = { energy: "monthly_energy_bill", transport: "monthly_fuel_spend", food: "monthly_groceries", housing: "monthly_rent" };
const RISK_SECTORS = new Set(["employment", "finance", "technology", "health", "security", "currency"]);

type CurrencyKey = "USD" | "EUR" | "GBP" | "TRY";
const CURRENCIES: Record<CurrencyKey, { symbol: string; locale: string; defaults: Profile }> = {
  USD: { symbol: "$", locale: "en-US", defaults: { monthly_fuel_spend: 200, monthly_energy_bill: 150, monthly_groceries: 600, monthly_rent: 1500, monthly_income: 4000, savings: 15000 } },
  EUR: { symbol: "€", locale: "de-DE", defaults: { monthly_fuel_spend: 180, monthly_energy_bill: 130, monthly_groceries: 500, monthly_rent: 1200, monthly_income: 3500, savings: 12000 } },
  GBP: { symbol: "£", locale: "en-GB", defaults: { monthly_fuel_spend: 160, monthly_energy_bill: 120, monthly_groceries: 450, monthly_rent: 1100, monthly_income: 3200, savings: 11000 } },
  TRY: { symbol: "₺", locale: "tr-TR", defaults: { monthly_fuel_spend: 3000, monthly_energy_bill: 2500, monthly_groceries: 8000, monthly_rent: 15000, monthly_income: 45000, savings: 150000 } },
};

interface LN { node: ScenarioNode; x: number; y: number; depth: number }
interface LE { fromId: string; toId: string; color: string }

function doLayout(nodes: ScenarioNode[]): { lns: LN[]; les: LE[]; w: number; h: number } {
  const map = new Map(nodes.map(n => [n.id, n]));
  const childSet = new Set(nodes.flatMap(n => n.children));
  const roots = nodes.filter(n => !childSet.has(n.id));
  const depths = new Map<string, number>();
  const vis = new Set<string>();
  function walk(id: string, d: number) { if (vis.has(id)) return; vis.add(id); depths.set(id, d); map.get(id)?.children.forEach(c => walk(c, d + 1)); }
  roots.forEach(r => walk(r.id, 0));
  const byD = new Map<number, string[]>();
  depths.forEach((d, id) => { if (!byD.has(d)) byD.set(d, []); byD.get(d)!.push(id); });
  const CW = 310, CH = 195, PAD = 50;
  const maxC = Math.max(...Array.from(byD.values()).map(a => a.length), 1);
  const tw = Math.max(maxC * CW + PAD * 2, 800);
  const pos = new Map<string, [number, number]>();
  byD.forEach((ids, d) => { const rw = ids.length * CW; const sx = (tw - rw) / 2; ids.forEach((id, i) => pos.set(id, [sx + i * CW + CW / 2, d * CH + 70])); });
  const lns: LN[] = nodes.map(n => { const p = pos.get(n.id) || [tw / 2, 70]; return { node: n, x: p[0], y: p[1], depth: depths.get(n.id) || 0 }; });
  const les: LE[] = nodes.flatMap(n => n.children.filter(c => map.has(c)).map(c => ({ fromId: n.id, toId: c, color: sc(n.sector).color })));
  return { lns, les, w: tw, h: byD.size * CH + 60 };
}

function calcImpacts(nodes: ScenarioNode[], p: Profile) {
  const nm = new Map(nodes.map(n => [n.id, n]));
  function hasPD(n: ScenarioNode): boolean { return n.children.some(c => { const ch = nm.get(c); return ch ? (ch.region === "personal" || hasPD(ch)) : false; }); }
  function hasSSC(n: ScenarioNode, bk: string): boolean { return n.children.some(c => { const ch = nm.get(c); return ch ? BMAP[ch.sector] === bk : false; }); }
  const imp = new Map<string, number>(); let tot = 0;
  for (const n of nodes) { const bk = BMAP[n.sector]; if (!bk) continue; const sp = p[bk]; if (!sp || sp <= 0) continue; if (n.region !== "personal" && (hasPD(n) || hasSSC(n, bk))) continue; const ch = n.direction === "down" ? -(sp * n.magnitude / 100) : sp * n.magnitude / 100; imp.set(n.id, Math.round(ch)); tot += ch; }
  return { imp, tot: Math.round(tot), annual: Math.round(tot * 12) };
}

function drawEdges(canvas: HTMLCanvasElement, les: LE[], posMap: Map<string, [number, number]>, nodeH: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

  const t = performance.now() / 1000;
  for (const e of les) {
    const f = posMap.get(e.fromId);
    const to = posMap.get(e.toId);
    if (!f || !to) continue;
    const midY = (f[1] + nodeH / 2 + to[1] - nodeH / 2) / 2;
    ctx.beginPath();
    ctx.moveTo(f[0], f[1] + nodeH / 2);
    ctx.bezierCurveTo(f[0], midY, to[0], midY, to[0], to[1] - nodeH / 2);
    ctx.strokeStyle = e.color + "30";
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(f[0], f[1] + nodeH / 2);
    ctx.bezierCurveTo(f[0], midY, to[0], midY, to[0], to[1] - nodeH / 2);
    ctx.strokeStyle = e.color + "66";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = -(t * 14) % 10;
    ctx.stroke();
    ctx.setLineDash([]);
    const ax = to[0], ay = to[1] - nodeH / 2;
    ctx.beginPath();
    ctx.moveTo(ax - 6, ay - 8);
    ctx.lineTo(ax, ay);
    ctx.lineTo(ax + 6, ay - 8);
    ctx.strokeStyle = e.color + "77";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export default function Home() {
  const [active, setActive] = useState("hormuz_strait");
  const [ccy, setCcy] = useState<CurrencyKey>("USD");
  const cur = CURRENCIES[ccy];
  const [profile, setProfile] = useState<Profile>({ ...CURRENCIES.USD.defaults });
  const [simDone, setSimDone] = useState(false);
  const [impMap, setImpMap] = useState<Record<string, number>>({});
  const [totM, setTotM] = useState(0);
  const [totA, setTotA] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const data = scenarios[active as keyof typeof scenarios];
  const accent = ACCENT[active] || "#58a6ff";
  const { lns, les, w: svgW, h: svgH } = useMemo(() => doLayout(data.chain.nodes as ScenarioNode[]), [active]);
  const posMap = useMemo(() => { const m = new Map<string, [number, number]>(); lns.forEach(l => m.set(l.node.id, [l.x, l.y])); return m; }, [lns]);

  useEffect(() => {
    function animate() {
      if (canvasRef.current) drawEdges(canvasRef.current, les, posMap, 80);
      animRef.current = requestAnimationFrame(animate);
    }
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [les, posMap]);

  function handleScenario(k: string) { setActive(k); setSimDone(false); setImpMap({}); setSel(null); }
  function handleSimulate() {
    const r = calcImpacts(data.chain.nodes as ScenarioNode[], profile);
    const obj: Record<string, number> = {};
    r.imp.forEach((v, k) => { obj[k] = v; });
    setImpMap(obj); setTotM(r.tot); setTotA(r.annual); setSimDone(true);
  }
  function handleProfileChange(key: keyof Profile, val: string) { const n = parseFloat(val); setProfile(prev => ({ ...prev, [key]: isNaN(n) ? 0 : Math.max(0, n) })); clearStaleResults(); }

  function handleCurrency(c: CurrencyKey) { setCcy(c); setProfile({ ...CURRENCIES[c].defaults }); setSimDone(false); setImpMap({}); setTotM(0); setTotA(0); }
  function clearStaleResults() { setSimDone(false); setImpMap({}); setTotM(0); setTotA(0); }

  const savRun = totM > 0 && profile.savings > 0 ? Math.round((profile.savings / totM) * 10) / 10 : null;
  const fmt = (n: number) => (n >= 0 ? "+" : "-") + cur.symbol + Math.abs(n).toLocaleString(cur.locale);
  const selNode = sel ? (data.chain.nodes as ScenarioNode[]).find(n => n.id === sel) : null;
  const NW = 240, NH = 88;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", background: "#06080d", color: "#e6edf3", fontFamily: "Inter,-apple-system,sans-serif" }}>

      {/* HEADER */}
      <div style={{ height: 46, borderBottom: "1px solid #21262d", padding: "0 12px", display: "flex", alignItems: "center", gap: 8, background: "#0d1117", flexShrink: 0, zIndex: 20 }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, display: "grid", placeItems: "center", fontWeight: 900, fontSize: 12, background: accent + "20", color: accent, border: "1px solid " + accent + "44", flexShrink: 0 }}>D</div>
        <b style={{ fontSize: 14, flexShrink: 0 }}>Domino</b>
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap", flex: 1, justifyContent: "center" }}>
          {KEYS.map(k => {
            const s = scenarios[k as keyof typeof scenarios]; const c = ACCENT[k] || "#888"; const on = active === k;
            return <button key={k} type="button" onClick={() => handleScenario(k)} style={{ padding: "4px 8px", borderRadius: 5, fontSize: 9, fontWeight: on ? 700 : 500, background: on ? c + "22" : "transparent", color: on ? c : "#555", border: on ? "1px solid " + c + "55" : "1px solid transparent", cursor: "pointer", whiteSpace: "nowrap", outline: "none" }}>{s.scenario.name.split(" ").slice(0, 2).join(" ")}</button>;
          })}
        </div>
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          {(Object.keys(CURRENCIES) as CurrencyKey[]).map(c => (
            <button key={c} type="button" onClick={() => handleCurrency(c)} style={{ padding: "3px 6px", borderRadius: 4, fontSize: 9, fontWeight: ccy === c ? 700 : 500, background: ccy === c ? "#58a6ff22" : "transparent", color: ccy === c ? "#58a6ff" : "#555", border: ccy === c ? "1px solid #58a6ff55" : "1px solid transparent", cursor: "pointer", outline: "none" }}>{CURRENCIES[c].symbol}{c}</button>
          ))}
        </div>
        <button type="button" onClick={() => setShowPanel(p => !p)} style={{ fontSize: 10, color: "#888", padding: "4px 8px", borderRadius: 5, border: "1px solid #21262d", background: "transparent", cursor: "pointer", flexShrink: 0, outline: "none" }}>{showPanel ? "Hide" : "Show"}</button>
      </div>

      {/* BANNER */}
      <div style={{ height: 30, borderBottom: "1px solid #21262d", padding: "0 12px", display: "flex", alignItems: "center", gap: 10, background: accent + "08", flexShrink: 0 }}>
        <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, padding: "2px 6px", borderRadius: 3, background: accent + "22", color: accent }}>CRISIS</span>
        <b style={{ fontSize: 11 }}>{data.scenario.name}</b>
        <span style={{ fontSize: 9, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{data.scenario.description}</span>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* GRAPH AREA */}
        <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
          <div style={{ position: "relative", width: svgW, height: svgH, minWidth: "100%", minHeight: "100%" }}>
            {/* Canvas for animated connection lines */}
            <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: svgW, height: svgH, pointerEvents: "none" }} />

            {/* Node cards as positioned HTML divs */}
            {lns.map(l => {
              const n = l.node;
              const { color, label } = sc(n.sector);
              const isRoot = l.depth === 0;
              const isP = n.region === "personal";
              const cost = impMap[n.id] || null;
              const isSel = sel === n.id;
              const w = isRoot ? 290 : isP ? 260 : NW;

              return (
                <div key={n.id} onClick={() => setSel(sel === n.id ? null : n.id)} style={{
                  position: "absolute", left: l.x - w / 2, top: l.y - NH / 2, width: w, cursor: "pointer",
                  borderRadius: 10,                   border: "1.5px solid " + (isSel ? color : isP ? "#ff444455" : isRoot ? "#ff444444" : color + "25"),
                  background: isP
                    ? "linear-gradient(145deg, rgba(255,68,68,0.12) 0%, rgba(255,30,30,0.04) 100%)"
                    : isRoot
                    ? "linear-gradient(145deg, rgba(255,68,68,0.08) 0%, rgba(13,17,23,0.97) 100%)"
                    : "linear-gradient(145deg, rgba(22,27,34,0.98) 0%, rgba(13,17,23,0.95) 100%)",
                  boxShadow: isSel
                    ? "0 0 24px " + color + "35, 0 4px 12px rgba(0,0,0,0.4)"
                    : isRoot
                    ? "0 0 20px #ff444418, 0 4px 16px rgba(0,0,0,0.5)"
                    : isP
                    ? "0 0 16px #ff444415, 0 3px 10px rgba(0,0,0,0.4)"
                    : "0 2px 10px rgba(0,0,0,0.5), 0 0 1px " + color + "15",
                  transition: "border-color 0.2s, box-shadow 0.2s", zIndex: 2,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 9px 2px" }}>
                    <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1, padding: "1px 4px", borderRadius: 3, background: color + "22", color, border: "1px solid " + color + "33" }}>{label}</span>
                    {isRoot && <span style={{ fontSize: 7, fontWeight: 900, color: "#ff4444" }}>TRIGGER</span>}
                    <span style={{ marginLeft: "auto", fontSize: 8, fontWeight: 800, color }}>{n.direction === "up" ? "+" : n.direction === "down" ? "-" : ""}{n.magnitude}{n.unit.includes("%") ? "%" : ""}</span>
                    {n.delay_days > 0 && <span style={{ fontSize: 7, color: "#484f58" }}>+{n.delay_days}d</span>}
                  </div>
                  <div style={{ padding: "2px 9px 4px", fontSize: isRoot ? 12.5 : isP ? 10.5 : 9.5, fontWeight: isRoot ? 700 : 600, color: isP ? "#ff4444" : "#e6edf3", lineHeight: 1.35, letterSpacing: isRoot ? -0.2 : 0 }}>{n.event}</div>
                  <div style={{ padding: "0 9px 6px", display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: color + "18", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, width: Math.min(100, Math.log10(Math.max(1, Math.abs(n.magnitude))) * 33) + "%", background: `linear-gradient(90deg, ${color}88, ${color})` }} />
                    </div>
                    <div style={{ display: "flex", gap: 1.5, flexShrink: 0 }}>
                      {[1,2,3,4,5].map(i => <div key={i} style={{ width: 2, height: 8, borderRadius: 1, background: i <= Math.round(n.confidence * 5) ? color : color + "18" }} />)}
                    </div>
                  </div>
                  {isP && cost !== null && cost !== 0 && (
                    <div style={{ margin: "2px 7px 8px", padding: "7px 10px", borderRadius: 7, background: cost > 0 ? "linear-gradient(135deg, rgba(255,68,68,0.12), rgba(255,30,30,0.05))" : "linear-gradient(135deg, rgba(63,185,80,0.12), rgba(63,185,80,0.05))", border: cost > 0 ? "1px solid rgba(255,68,68,0.25)" : "1px solid rgba(63,185,80,0.25)" }}>
                      <div style={{ fontSize: 7, fontWeight: 900, color: cost > 0 ? "#ff4444" : "#3fb950", letterSpacing: 1.5, marginBottom: 2 }}>YOUR MONTHLY COST</div>
                      <span style={{ fontSize: 18, fontWeight: 900, color: cost > 0 ? "#ff4444" : "#3fb950" }}>{fmt(cost)}</span>
                      <span style={{ fontSize: 9, color: cost > 0 ? "#ff444466" : "#3fb95066" }}>/mo</span>
                    </div>
                  )}
                  {isP && (cost === null || cost === 0) && RISK_SECTORS.has(n.sector) && (
                    <div style={{ margin: "2px 7px 8px", padding: "6px 10px", borderRadius: 7, background: "linear-gradient(135deg, rgba(240,160,48,0.12), rgba(240,160,48,0.05))", border: "1px solid rgba(240,160,48,0.25)" }}>
                      <div style={{ fontSize: 7, fontWeight: 900, color: "#f0a030", letterSpacing: 1.5, marginBottom: 2 }}>YOUR RISK LEVEL</div>
                      <span style={{ fontSize: 16, fontWeight: 900, color: n.magnitude >= 40 ? "#ff4444" : n.magnitude >= 20 ? "#f0a030" : "#e3b341" }}>
                        {n.magnitude >= 60 ? "CRITICAL" : n.magnitude >= 40 ? "HIGH" : n.magnitude >= 20 ? "MODERATE" : "LOW"}
                      </span>
                      <span style={{ fontSize: 10, color: "#f0a03088", marginLeft: 6 }}>{n.magnitude}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Floating impact */}
          {simDone && (
            <div style={{ position: "fixed", bottom: 24, left: 24, zIndex: 30, borderRadius: 14, border: "1px solid #ff444433", padding: "18px 22px", background: "linear-gradient(145deg, rgba(13,17,23,0.97), rgba(6,8,13,0.98))", backdropFilter: "blur(12px)", boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(255,68,68,0.08)" }}>
              <div style={{ fontSize: 8, color: "#888", fontWeight: 900, letterSpacing: 2 }}>TOTAL PERSONAL IMPACT</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: totM > 0 ? "#ff4444" : "#3fb950", lineHeight: 1.1, marginTop: 4 }}>{fmt(totM)}<span style={{ fontSize: 11, fontWeight: 400, color: totM > 0 ? "#ff444444" : "#3fb95044" }}>/mo</span></div>
              <div style={{ fontSize: 16, fontWeight: 700, color: totA > 0 ? "#f0a030" : "#3fb950", marginTop: 3 }}>{fmt(totA)}<span style={{ fontSize: 10, color: totA > 0 ? "#f0a03044" : "#3fb95044" }}>/yr</span></div>
              {savRun !== null && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #21262d" }}>
                  <div style={{ fontSize: 7, color: "#888", fontWeight: 800, letterSpacing: 1.5, marginBottom: 3 }}>SAVINGS RUNWAY</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 24, fontWeight: 900, color: savRun > 12 ? "#3fb950" : savRun > 6 ? "#f0a030" : "#ff4444" }}>{savRun}</span>
                    <span style={{ fontSize: 10, color: "#555" }}>months</span>
                  </div>
                  <div style={{ marginTop: 5, height: 5, borderRadius: 3, background: "#21262d", width: 140, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, width: Math.min(100, (savRun / 36) * 100) + "%", background: `linear-gradient(90deg, ${savRun > 12 ? "#3fb950" : savRun > 6 ? "#f0a030" : "#ff4444"}88, ${savRun > 12 ? "#3fb950" : savRun > 6 ? "#f0a030" : "#ff4444"})` }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SIDE PANEL */}
        {showPanel && (
          <div style={{ width: 290, borderLeft: "1px solid #21262d", background: "#0d1117", padding: 14, overflowY: "auto", flexShrink: 0, zIndex: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#888", letterSpacing: 1.5, marginBottom: 10 }}>YOUR PROFILE</div>
            {([["Monthly Fuel", "monthly_fuel_spend"], ["Monthly Energy", "monthly_energy_bill"], ["Monthly Groceries", "monthly_groceries"], ["Monthly Rent", "monthly_rent"], ["Monthly Income", "monthly_income"], ["Total Savings", "savings"]] as [string, keyof Profile][]).map(([lbl, key]) => (
              <div key={key} style={{ marginBottom: 7 }}>
                <div style={{ fontSize: 9, color: "#888", marginBottom: 2 }}>{lbl} ({cur.symbol})</div>
                <input type="number" min={0} value={profile[key] ?? ""} onChange={e => handleProfileChange(key, e.target.value)} style={{ width: "100%", background: "#161b22", border: "1px solid #21262d", borderRadius: 6, padding: "7px 10px", color: "#e6edf3", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <button type="button" onClick={handleSimulate} style={{ width: "100%", marginTop: 8, padding: "10px 0", borderRadius: 7, fontWeight: 800, fontSize: 11, background: accent, color: "#fff", border: "none", cursor: "pointer", outline: "none" }}>SIMULATE CASCADE</button>

            {selNode && (
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid #21262d" }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: "#888", letterSpacing: 1.5, marginBottom: 6 }}>NODE DETAIL</div>
                <div style={{ borderRadius: 8, border: "1px solid " + sc(selNode.sector).color + "33", background: sc(selNode.sector).color + "06", padding: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: sc(selNode.sector).color, marginBottom: 4 }}>{selNode.event}</div>
                  <div style={{ fontSize: 9, color: "#888", lineHeight: 1.5, marginBottom: 8 }}>{selNode.detail}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    {[["Magnitude", selNode.magnitude + (selNode.unit === "%" ? "%" : " " + selNode.unit)], ["Delay", selNode.delay_days + " days"], ["Confidence", (selNode.confidence * 100).toFixed(0) + "%"], ["Duration", selNode.duration_days + "d"]].map(([k, v]) => (
                      <div key={k} style={{ background: "#0d1117", borderRadius: 5, padding: "4px 6px" }}>
                        <div style={{ fontSize: 7, color: "#555" }}>{k}</div>
                        <div style={{ fontSize: 10, fontWeight: 700 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {selNode.source && <div style={{ fontSize: 8, color: "#555", marginTop: 6 }}>Source: {selNode.source}</div>}
                </div>
              </div>
            )}

            {simDone && (
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid #21262d" }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: "#888", letterSpacing: 1.5, marginBottom: 6 }}>IMPACT BREAKDOWN</div>
                {Object.entries(impMap).filter(([, v]) => v !== 0).sort(([, a], [, b]) => Math.abs(b) - Math.abs(a)).map(([id, cost]) => {
                  const nd = (data.chain.nodes as ScenarioNode[]).find(n => n.id === id);
                  if (!nd) return null;
                  return (
                    <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 9, padding: "5px 7px", marginBottom: 2, borderRadius: 6, background: "#161b22", border: "1px solid #21262d" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, overflow: "hidden" }}>
                        <div style={{ width: 2.5, height: 12, borderRadius: 2, background: sc(nd.sector).color, flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nd.event}</span>
                      </div>
                      <span style={{ fontWeight: 800, color: cost > 0 ? "#ff4444" : "#3fb950", marginLeft: 6, flexShrink: 0 }}>{fmt(cost)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
