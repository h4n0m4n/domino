"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  Position,
  MarkerType,
  Handle,
} from "@xyflow/react";
import { scenarios as builtinScenarios, type ScenarioNode, type ScenarioData } from "./scenario-data";

/* ═══════════════════════════════════════════════════════════════
   SECTOR THEMING
   ═══════════════════════════════════════════════════════════════ */

const SECTOR: Record<string, { color: string; label: string }> = {
  security:   { color: "#ff4444", label: "SEC" },
  energy:     { color: "#f0a030", label: "NRG" },
  food:       { color: "#3fb950", label: "FOOD" },
  transport:  { color: "#58a6ff", label: "TRNS" },
  employment: { color: "#bc8cff", label: "JOBS" },
  currency:   { color: "#e3b341", label: "FX" },
  finance:    { color: "#58a6ff", label: "FIN" },
  health:     { color: "#f778ba", label: "HLTH" },
  technology: { color: "#bc8cff", label: "TECH" },
  housing:    { color: "#da7756", label: "HOUS" },
};

const sc = (sector: string) => SECTOR[sector] || { color: "#8b949e", label: "?" };

const SCENARIO_ACCENT: Record<string, string> = {
  hormuz_strait: "#ff4444",
  dollar_crisis: "#f0a030",
  ai_displacement: "#bc8cff",
  pandemic_v2: "#3fb950",
};

/* ═══════════════════════════════════════════════════════════════
   CUSTOM NODE
   ═══════════════════════════════════════════════════════════════ */

interface DominoNodeData {
  node: ScenarioNode;
  isRoot: boolean;
  personalCost: number | null;
  [key: string]: unknown;
}

function DominoNode({ data }: { data: DominoNodeData }) {
  const { node, isRoot, personalCost } = data;
  const { color, label } = sc(node.sector);
  const isPersonal = node.region === "personal";
  const severity = Math.abs(node.magnitude) >= 50 ? "critical" : Math.abs(node.magnitude) >= 20 ? "high" : "normal";

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: color, border: "none", width: 6, height: 6 }} />

      <div
        className={`rounded-xl border backdrop-blur-sm transition-all ${isRoot ? "node-pulse" : ""} ${isPersonal ? "node-pulse" : ""}`}
        style={{
          background: isPersonal
            ? "linear-gradient(135deg, rgba(255,68,68,0.15), rgba(255,68,68,0.05))"
            : isRoot
            ? "linear-gradient(135deg, rgba(255,68,68,0.12), rgba(13,17,23,0.95))"
            : "rgba(13,17,23,0.92)",
          borderColor: isPersonal ? "#ff444466" : isRoot ? "#ff444444" : `${color}33`,
          minWidth: isRoot ? 280 : isPersonal ? 260 : 220,
          maxWidth: isRoot ? 320 : 280,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-1">
          <span
            className="text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded"
            style={{ background: `${color}22`, color, border: `1px solid ${color}33` }}
          >
            {label}
          </span>
          {node.delay_days > 0 && (
            <span className="text-[9px] text-[#484f58] ml-auto">+{node.delay_days}d</span>
          )}
          {isRoot && (
            <span className="text-[9px] font-bold text-[#ff4444] ml-auto tracking-wider">TRIGGER</span>
          )}
        </div>

        {/* Title */}
        <div className="px-3 pb-1">
          <div className={`font-semibold leading-tight ${isRoot ? "text-[13px]" : "text-[11px]"}`} style={{ color: isPersonal ? "#ff4444" : "#e6edf3" }}>
            {node.event}
          </div>
        </div>

        {/* Magnitude Bar */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${color}15` }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.abs(node.magnitude) * (node.magnitude > 50 ? 1 : 1.5))}%`,
                  background: `linear-gradient(90deg, ${color}88, ${color})`,
                }}
              />
            </div>
            <span className="text-[10px] font-bold shrink-0" style={{ color }}>
              {node.direction === "up" ? "+" : node.direction === "down" ? "-" : ""}{node.magnitude}{node.unit === "%" ? "%" : ""}
            </span>
          </div>
        </div>

        {/* Personal Cost */}
        {isPersonal && personalCost !== null && personalCost !== 0 && (
          <div className="mx-3 mb-3 px-2.5 py-2 rounded-lg" style={{ background: "rgba(255,68,68,0.12)", border: "1px solid rgba(255,68,68,0.25)" }}>
            <div className="text-[9px] text-[#ff4444] font-bold tracking-wider mb-0.5">YOUR COST</div>
            <div className="text-lg font-black text-[#ff4444]">
              TRY {personalCost >= 0 ? "+" : ""}{personalCost.toLocaleString("tr-TR")}<span className="text-[10px] font-normal text-[#ff444488]">/mo</span>
            </div>
          </div>
        )}

        {/* Confidence */}
        <div className="px-3 pb-2 flex items-center gap-3">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-1 h-3 rounded-sm"
                style={{
                  background: i <= Math.round(node.confidence * 5) ? color : `${color}22`,
                }}
              />
            ))}
          </div>
          <span className="text-[8px] text-[#484f58]">{(node.confidence * 100).toFixed(0)}% confidence</span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: color, border: "none", width: 6, height: 6 }} />
    </>
  );
}

const nodeTypes = { domino: DominoNode };

/* ═══════════════════════════════════════════════════════════════
   LAYOUT ENGINE
   ═══════════════════════════════════════════════════════════════ */

function layoutCascade(nodes: ScenarioNode[]): { rfNodes: Node[]; rfEdges: Edge[] } {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const childSet = new Set(nodes.flatMap((n) => n.children));
  const roots = nodes.filter((n) => !childSet.has(n.id));

  const positions = new Map<string, { x: number; y: number }>();
  const depths = new Map<string, number>();
  const visited = new Set<string>();

  function assignDepth(id: string, depth: number) {
    if (visited.has(id)) return;
    visited.add(id);
    depths.set(id, depth);
    const node = nodeMap.get(id);
    if (node) node.children.forEach((cid) => assignDepth(cid, depth + 1));
  }
  roots.forEach((r) => assignDepth(r.id, 0));

  const maxDepth = Math.max(...depths.values(), 0);
  const byDepth = new Map<number, string[]>();
  depths.forEach((d, id) => {
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d)!.push(id);
  });

  const Y_GAP = 180;
  const X_GAP = 300;

  byDepth.forEach((ids, depth) => {
    const totalWidth = (ids.length - 1) * X_GAP;
    ids.forEach((id, i) => {
      positions.set(id, {
        x: -totalWidth / 2 + i * X_GAP,
        y: depth * Y_GAP,
      });
    });
  });

  const rfNodes: Node[] = nodes.map((n) => ({
    id: n.id,
    type: "domino",
    position: positions.get(n.id) || { x: 0, y: 0 },
    data: { node: n, isRoot: !childSet.has(n.id) && depths.get(n.id) === 0, personalCost: null } satisfies DominoNodeData,
  }));

  const rfEdges: Edge[] = nodes.flatMap((n) =>
    n.children.map((cid) => ({
      id: `${n.id}-${cid}`,
      source: n.id,
      target: cid,
      animated: true,
      style: { stroke: sc(n.sector).color, strokeWidth: 2, opacity: 0.6 },
      markerEnd: { type: MarkerType.ArrowClosed, color: sc(n.sector).color, width: 14, height: 14 },
    }))
  );

  return { rfNodes, rfEdges };
}

/* ═══════════════════════════════════════════════════════════════
   PROFILE & IMPACT
   ═══════════════════════════════════════════════════════════════ */

interface Profile {
  monthly_fuel_spend: number;
  monthly_energy_bill: number;
  monthly_groceries: number;
  monthly_rent: number;
  monthly_income: number;
  savings: number;
}

const BUDGET_MAP: Record<string, keyof Profile> = {
  energy: "monthly_energy_bill",
  transport: "monthly_fuel_spend",
  food: "monthly_groceries",
  housing: "monthly_rent",
};

function computeImpacts(nodes: ScenarioNode[], profile: Profile) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  function hasPersonalDesc(n: ScenarioNode): boolean {
    return n.children.some((cid) => {
      const c = nodeMap.get(cid);
      return c && (c.region === "personal" || hasPersonalDesc(c));
    });
  }

  function hasSameSectorChild(n: ScenarioNode, budgetKey: string): boolean {
    return n.children.some((cid) => {
      const c = nodeMap.get(cid);
      return c && BUDGET_MAP[c.sector] === budgetKey;
    });
  }

  const impacts = new Map<string, number>();
  let total = 0;

  for (const n of nodes) {
    const budgetKey = BUDGET_MAP[n.sector];
    if (!budgetKey) continue;
    const spend = profile[budgetKey];
    if (!spend) continue;
    if (n.region !== "personal" && (hasPersonalDesc(n) || hasSameSectorChild(n, budgetKey))) continue;

    const pct = n.magnitude / 100;
    const change = n.direction === "down" ? -(spend * pct) : spend * pct;
    impacts.set(n.id, Math.round(change));
    total += change;
  }

  return { impacts, totalMonthly: Math.round(total), totalAnnual: Math.round(total * 12) };
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function Home() {
  const [scenarios, setScenarios] = useState(builtinScenarios);
  const [active, setActive] = useState("hormuz_strait");
  const SCENARIOS = Object.keys(scenarios);

  useEffect(() => {
    fetch("/api/scenarios")
      .then((r) => r.ok ? r.json() : null)
      .then((list) => {
        if (!list || !Array.isArray(list)) return;
        const toLoad = list.filter((s: { id: string }) => !(s.id in builtinScenarios));
        toLoad.forEach((s: { id: string }) => {
          fetch(`/api/scenarios/${s.id}`)
            .then((r) => r.ok ? r.json() : null)
            .then((full) => {
              if (!full || full.error || !full.chain) return;
              const nodes: ScenarioNode[] = full.chain.nodes;
              const edges = full.chain.edges;
              setScenarios((prev) => ({
                ...prev,
                [s.id]: { scenario: full.scenario, chain: { nodes, edges } } as ScenarioData,
              }));
            })
            .catch(() => {});
        });
      })
      .catch(() => {});
  }, []);
  const [profile, setProfile] = useState<Profile>({
    monthly_fuel_spend: 3000,
    monthly_energy_bill: 2500,
    monthly_groceries: 8000,
    monthly_rent: 15000,
    monthly_income: 45000,
    savings: 150000,
  });
  const [simulated, setSimulated] = useState(false);
  const [impactMap, setImpactMap] = useState(new Map<string, number>());
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [totalAnnual, setTotalAnnual] = useState(0);
  const [panelOpen, setPanelOpen] = useState(true);

  const data = scenarios[active as keyof typeof scenarios];
  const accent = SCENARIO_ACCENT[active] || "#ff4444";

  const { rfNodes, rfEdges } = useMemo(() => layoutCascade(data.chain.nodes as ScenarioNode[]), [data]);

  const nodesWithImpact = useMemo(() => {
    if (!simulated) return rfNodes;
    return rfNodes.map((n) => ({
      ...n,
      data: { ...n.data, personalCost: impactMap.get(n.id) ?? null },
    }));
  }, [rfNodes, simulated, impactMap]);

  const handleSimulate = useCallback(() => {
    const result = computeImpacts(data.chain.nodes as ScenarioNode[], profile);
    setImpactMap(result.impacts);
    setTotalMonthly(result.totalMonthly);
    setTotalAnnual(result.totalAnnual);
    setSimulated(true);
  }, [data, profile]);

  const handleScenarioChange = useCallback((key: string) => {
    setActive(key);
    setSimulated(false);
    setImpactMap(new Map());
  }, []);

  const savingsRunway = totalMonthly > 0 && profile.savings > 0
    ? Math.round((profile.savings / totalMonthly) * 10) / 10
    : null;

  const fmt = (n: number) => `${n >= 0 ? "+" : ""}${n.toLocaleString("tr-TR")}`;

  const field = (label: string, key: keyof Profile) => (
    <div key={key}>
      <label className="text-[10px] text-[#8b949e] mb-1 block">{label}</label>
      <input
        type="number"
        value={profile[key] || ""}
        onChange={(e) => { setProfile({ ...profile, [key]: parseFloat(e.target.value) || 0 }); setSimulated(false); }}
        className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg text-xs px-3 py-2 text-white outline-none focus:border-[#58a6ff] transition-colors"
        placeholder="0"
      />
    </div>
  );

  return (
    <div className="h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="h-12 border-b border-[#21262d] px-4 flex items-center justify-between shrink-0 bg-[#0d1117]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs" style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}33` }}>D</div>
          <span className="text-sm font-bold tracking-tight">Domino</span>
          <span className="text-[10px] text-[#484f58] hidden sm:inline">Cascading Impact Engine</span>
        </div>

        {/* Scenario Tabs */}
        <div className="flex items-center gap-1">
          {SCENARIOS.map((key) => {
            const s = scenarios[key as keyof typeof scenarios];
            const c = SCENARIO_ACCENT[key] || "#8b949e";
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => handleScenarioChange(key)}
                className="px-2.5 py-1 rounded-md text-[10px] font-medium transition-all"
                style={{
                  background: isActive ? `${c}18` : "transparent",
                  color: isActive ? c : "#484f58",
                  border: `1px solid ${isActive ? `${c}44` : "transparent"}`,
                }}
              >
                {s.scenario.name.split(" ").slice(0, 2).join(" ")}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setPanelOpen(!panelOpen)} className="text-[10px] text-[#8b949e] px-2 py-1 rounded border border-[#21262d] hover:border-[#8b949e] transition-colors">
            {panelOpen ? "Hide Panel" : "Show Panel"}
          </button>
        </div>
      </header>

      {/* ── Crisis Banner ── */}
      <div className="h-9 border-b flex items-center px-4 shrink-0" style={{ borderColor: "#21262d", background: `${accent}06` }}>
        <span className="text-[9px] font-black tracking-widest px-2 py-0.5 rounded mr-3" style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}33` }}>
          ACTIVE CRISIS
        </span>
        <span className="text-xs font-semibold text-[#e6edf3]">{data.scenario.name}</span>
        <span className="text-[10px] text-[#484f58] ml-3 truncate hidden md:inline">{data.scenario.description}</span>
        <span className="ml-auto text-[10px] text-[#484f58] shrink-0">{data.chain.nodes.length} nodes</span>
      </div>

      {/* ── Main Area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Graph */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodesWithImpact}
            edges={rfEdges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.2}
            maxZoom={1.5}
            defaultEdgeOptions={{ animated: true }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#21262d" gap={40} size={1} />
            <Controls position="bottom-left" />
            <MiniMap
              nodeColor={(n) => {
                const nd = n.data as DominoNodeData;
                return nd?.node ? sc(nd.node.sector).color : "#8b949e";
              }}
              maskColor="rgba(6,8,13,0.85)"
              position="bottom-right"
            />
          </ReactFlow>

          {/* Impact Floating Badge */}
          {simulated && (
            <div className="absolute top-4 left-4 fade-in">
              <div className="rounded-xl border px-5 py-4 backdrop-blur-md" style={{ background: "rgba(13,17,23,0.9)", borderColor: "#ff444444" }}>
                <div className="text-[9px] text-[#8b949e] font-bold tracking-widest mb-1">TOTAL PERSONAL IMPACT</div>
                <div className="text-2xl font-black text-[#ff4444]">TRY {fmt(totalMonthly)}<span className="text-xs font-normal text-[#ff444466]">/mo</span></div>
                <div className="text-sm font-bold text-[#f0a030] mt-0.5">TRY {fmt(totalAnnual)}<span className="text-xs font-normal text-[#f0a03066]">/yr</span></div>
                {savingsRunway && (
                  <div className="mt-2 pt-2 border-t border-[#21262d]">
                    <div className="text-[9px] text-[#8b949e] mb-1">SAVINGS DEPLETION</div>
                    <div className="flex items-end gap-1">
                      <span className="text-lg font-black" style={{ color: savingsRunway > 12 ? "#3fb950" : savingsRunway > 6 ? "#f0a030" : "#ff4444" }}>
                        {savingsRunway}
                      </span>
                      <span className="text-[10px] text-[#484f58] pb-0.5">months</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-[#21262d] overflow-hidden w-40">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(100, (savingsRunway / 36) * 100)}%`,
                          background: savingsRunway > 12 ? "#3fb950" : savingsRunway > 6 ? "#f0a030" : "#ff4444",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Side Panel ── */}
        {panelOpen && (
          <div className="w-[320px] border-l border-[#21262d] bg-[#0d1117]/80 backdrop-blur-md overflow-y-auto scrollbar-thin shrink-0 p-4 fade-in">
            <h3 className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mb-3">Your Profile</h3>
            <div className="space-y-2">
              {field("Monthly Fuel (TRY)", "monthly_fuel_spend")}
              {field("Monthly Energy (TRY)", "monthly_energy_bill")}
              {field("Monthly Groceries (TRY)", "monthly_groceries")}
              {field("Monthly Rent (TRY)", "monthly_rent")}
              {field("Monthly Income (TRY)", "monthly_income")}
              {field("Total Savings (TRY)", "savings")}
            </div>

            <button
              onClick={handleSimulate}
              className="w-full mt-4 py-2.5 rounded-lg font-bold text-xs transition-all hover:shadow-lg"
              style={{ background: accent, color: "#fff", boxShadow: `0 0 20px ${accent}33` }}
            >
              SIMULATE CASCADE
            </button>

            {/* Impact Breakdown */}
            {simulated && (
              <div className="mt-5 pt-4 border-t border-[#21262d] fade-in">
                <h3 className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mb-3">Impact Breakdown</h3>
                <div className="space-y-1.5">
                  {Array.from(impactMap.entries())
                    .filter(([, v]) => v !== 0)
                    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                    .map(([id, cost]) => {
                      const node = (data.chain.nodes as ScenarioNode[]).find((n) => n.id === id);
                      if (!node) return null;
                      const { color } = sc(node.sector);
                      return (
                        <div key={id} className="flex items-center justify-between text-[10px] px-2 py-1.5 rounded-lg bg-[#161b22] border border-[#21262d]">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-1 h-4 rounded-full shrink-0" style={{ background: color }} />
                            <span className="text-[#e6edf3] truncate">{node.event}</span>
                          </div>
                          <span className="font-bold shrink-0 ml-2" style={{ color: cost > 0 ? "#ff4444" : "#3fb950" }}>
                            {fmt(cost)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
