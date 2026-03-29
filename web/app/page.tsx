"use client";

import { useState, useEffect, useCallback } from "react";

/* ─── Types ─── */
interface CascadeNode {
  id: string;
  event: string;
  detail: string;
  sector: string;
  region: string;
  magnitude: number;
  unit: string;
  direction: string;
  delay_days: number;
  duration_days: number;
  confidence: number;
  source: string;
  children: string[];
}

interface Edge {
  source: string;
  target: string;
}

interface PersonalImpact {
  node_id: string;
  event: string;
  sector: string;
  monthly_cost_change: number;
  description: string;
  delay_days: number;
}

interface Profile {
  monthly_fuel_spend: number;
  monthly_energy_bill: number;
  monthly_groceries: number;
  monthly_rent: number;
  monthly_income: number;
  savings: number;
  profession: string;
  city: string;
  family_size: number;
}

/* ─── Scenario data (works without backend) ─── */
import { scenarios, type ScenarioData } from "./scenario-data";

/* ─── Sector Config ─── */
const SECTOR_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  security:   { color: "#ff4444", bg: "rgba(255,68,68,0.1)",   icon: "!" },
  energy:     { color: "#f0a030", bg: "rgba(240,160,48,0.1)",  icon: "⚡" },
  food:       { color: "#3fb950", bg: "rgba(63,185,80,0.1)",   icon: "~" },
  transport:  { color: "#58a6ff", bg: "rgba(88,166,255,0.1)",  icon: ">" },
  employment: { color: "#bc8cff", bg: "rgba(188,140,255,0.1)", icon: "#" },
  currency:   { color: "#f0c030", bg: "rgba(240,192,48,0.1)",  icon: "$" },
  housing:    { color: "#da7756", bg: "rgba(218,119,86,0.1)",  icon: "^" },
  finance:    { color: "#58a6ff", bg: "rgba(88,166,255,0.1)",  icon: "%" },
};

const getSectorStyle = (sector: string) =>
  SECTOR_CONFIG[sector] || { color: "#8b949e", bg: "rgba(139,148,158,0.1)", icon: "?" };

/* ─── Helper ─── */
const formatCurrency = (n: number) => {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`;
};

/* ─── Components ─── */

function DominoNode({
  node,
  depth,
  index,
  isActive,
  personalImpact,
  onClick,
}: {
  node: CascadeNode;
  depth: number;
  index: number;
  isActive: boolean;
  personalImpact?: PersonalImpact;
  onClick: () => void;
}) {
  const s = getSectorStyle(node.sector);
  const delay = 0.15 * index;
  const severityLevel =
    Math.abs(node.magnitude) >= 50 ? "critical" :
    Math.abs(node.magnitude) >= 20 ? "severe" :
    Math.abs(node.magnitude) >= 10 ? "significant" : "moderate";

  return (
    <div
      className={`cascade-node cursor-pointer transition-all duration-300 ${isActive ? "ring-2 scale-[1.02]" : "hover:scale-[1.01]"}`}
      style={{
        animationDelay: `${delay}s`,
        marginLeft: `${depth * 24}px`,
        borderColor: isActive ? s.color : "transparent",
        ringColor: s.color,
      }}
      onClick={onClick}
    >
      <div
        className="rounded-lg border p-3 mb-2 transition-all"
        style={{
          background: isActive ? s.bg : "#0d1117",
          borderColor: isActive ? s.color : "#21262d",
          boxShadow: severityLevel === "critical" ? `0 0 20px ${s.color}33` : "none",
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="shrink-0 w-7 h-7 rounded flex items-center justify-center text-xs font-bold"
              style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}44` }}
            >
              {s.icon}
            </span>
            <span className="text-sm font-medium truncate">{node.event}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {node.delay_days > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#21262d", color: "#8b949e" }}>
                +{node.delay_days}d
              </span>
            )}
            <span
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{ background: `${s.color}22`, color: s.color }}
            >
              {node.direction === "up" ? "+" : node.direction === "down" ? "-" : ""}{node.magnitude}{node.unit === "%" ? "%" : ` ${node.unit}`}
            </span>
          </div>
        </div>

        {personalImpact && personalImpact.monthly_cost_change !== 0 && (
          <div
            className="mt-2 text-xs font-bold px-2 py-1 rounded flex items-center gap-1"
            style={{
              background: "rgba(255,68,68,0.1)",
              color: "#ff4444",
              border: "1px solid rgba(255,68,68,0.2)",
            }}
          >
            <span>YOUR COST:</span>
            <span className="text-sm">TRY {formatCurrency(personalImpact.monthly_cost_change)}/mo</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfilePanel({
  profile,
  onChange,
  onSimulate,
}: {
  profile: Profile;
  onChange: (p: Profile) => void;
  onSimulate: () => void;
}) {
  const field = (label: string, key: keyof Profile, prefix = "TRY") => (
    <div key={key}>
      <label className="text-xs text-[#8b949e] mb-1 block">{label}</label>
      <div className="flex items-center rounded border border-[#21262d] bg-[#0d1117] overflow-hidden">
        <span className="text-xs text-[#8b949e] px-2 bg-[#161b22] py-2 border-r border-[#21262d]">{prefix}</span>
        <input
          type="number"
          value={profile[key] || ""}
          onChange={(e) => onChange({ ...profile, [key]: parseFloat(e.target.value) || 0 })}
          className="bg-transparent text-sm text-white px-2 py-2 w-full outline-none"
          placeholder="0"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-[#e6edf3] uppercase tracking-wider">Your Profile</h3>
      <p className="text-xs text-[#8b949e]">Enter your monthly expenses to see personal impact</p>
      <div className="space-y-2">
        {field("Monthly Fuel", "monthly_fuel_spend")}
        {field("Monthly Energy Bill", "monthly_energy_bill")}
        {field("Monthly Groceries", "monthly_groceries")}
        {field("Monthly Rent", "monthly_rent")}
        {field("Monthly Income", "monthly_income")}
        {field("Total Savings", "savings")}
      </div>
      <div>
        <label className="text-xs text-[#8b949e] mb-1 block">City</label>
        <input
          type="text"
          value={profile.city}
          onChange={(e) => onChange({ ...profile, city: e.target.value })}
          className="w-full bg-[#0d1117] border border-[#21262d] rounded text-sm px-3 py-2 text-white outline-none"
          placeholder="Istanbul"
        />
      </div>
      <button
        onClick={onSimulate}
        className="w-full py-2.5 rounded-lg font-bold text-sm transition-all bg-[#ff4444] hover:bg-[#ff5555] text-white hover:shadow-[0_0_20px_rgba(255,68,68,0.3)]"
      >
        SIMULATE CASCADE
      </button>
    </div>
  );
}

function ImpactSummary({
  totalMonthly,
  totalAnnual,
  savingsRunway,
  impacts,
}: {
  totalMonthly: number;
  totalAnnual: number;
  savingsRunway: number | null;
  impacts: PersonalImpact[];
}) {
  const significantImpacts = impacts.filter((i) => i.monthly_cost_change !== 0);

  return (
    <div className="space-y-4">
      {/* Big Numbers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-[#ff4444]/30 bg-[#ff4444]/5 p-4">
          <div className="text-xs text-[#8b949e] uppercase tracking-wider">Monthly Hit</div>
          <div className="text-2xl font-black text-[#ff4444] count-animate mt-1">
            TRY {formatCurrency(totalMonthly)}
          </div>
        </div>
        <div className="rounded-lg border border-[#f0a030]/30 bg-[#f0a030]/5 p-4">
          <div className="text-xs text-[#8b949e] uppercase tracking-wider">Annual Hit</div>
          <div className="text-2xl font-black text-[#f0a030] count-animate mt-1">
            TRY {formatCurrency(totalAnnual)}
          </div>
        </div>
      </div>

      {/* Savings Runway */}
      {savingsRunway && (
        <div className="rounded-lg border border-[#ff4444]/20 bg-[#ff4444]/5 p-4">
          <div className="text-xs text-[#8b949e] uppercase tracking-wider mb-2">Savings Depletion</div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-[#ff4444]">{savingsRunway}</span>
            <span className="text-sm text-[#8b949e] pb-1">months until empty</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-[#21262d] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(100, (savingsRunway / 24) * 100)}%`,
                background: savingsRunway > 12 ? "#3fb950" : savingsRunway > 6 ? "#f0a030" : "#ff4444",
              }}
            />
          </div>
        </div>
      )}

      {/* Breakdown */}
      <div>
        <h4 className="text-xs text-[#8b949e] uppercase tracking-wider mb-2">Impact Breakdown</h4>
        <div className="space-y-1">
          {significantImpacts
            .sort((a, b) => Math.abs(b.monthly_cost_change) - Math.abs(a.monthly_cost_change))
            .map((impact, i) => {
              const s = getSectorStyle(impact.sector);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs p-2 rounded border border-[#21262d] bg-[#0d1117]"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-[#e6edf3] truncate max-w-[200px]">{impact.event}</span>
                  </div>
                  <span className="font-bold" style={{ color: impact.monthly_cost_change > 0 ? "#ff4444" : "#3fb950" }}>
                    TRY {formatCurrency(impact.monthly_cost_change)}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

/* ─── Scenario Selector ─── */
const SCENARIO_KEYS = Object.keys(scenarios) as (keyof typeof scenarios)[];

const SCENARIO_COLORS: Record<string, string> = {
  hormuz_strait: "#ff4444",
  dollar_crisis: "#f0a030",
  ai_displacement: "#bc8cff",
  pandemic_v2: "#3fb950",
};

/* ─── Main Page ─── */

export default function Home() {
  const [activeScenario, setActiveScenario] = useState<string>("hormuz_strait");
  const [nodes, setNodes] = useState<CascadeNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [scenarioInfo, setScenarioInfo] = useState<{ name: string; description: string } | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [simulated, setSimulated] = useState(false);
  const [impacts, setImpacts] = useState<PersonalImpact[]>([]);
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [totalAnnual, setTotalAnnual] = useState(0);
  const [savingsRunway, setSavingsRunway] = useState<number | null>(null);

  const [profile, setProfile] = useState<Profile>({
    monthly_fuel_spend: 3000,
    monthly_energy_bill: 2500,
    monthly_groceries: 8000,
    monthly_rent: 15000,
    monthly_income: 45000,
    savings: 150000,
    profession: "",
    city: "Istanbul",
    family_size: 3,
  });

  const loadScenario = useCallback((key: string) => {
    const data = scenarios[key as keyof typeof scenarios];
    if (!data) return;
    setActiveScenario(key);
    setNodes(data.chain.nodes as CascadeNode[]);
    setEdges(data.chain.edges as Edge[]);
    setScenarioInfo(data.scenario);
    setSelectedNode(null);
    setSimulated(false);
  }, []);

  useEffect(() => {
    loadScenario("hormuz_strait");
  }, [loadScenario]);

  const buildTree = useCallback(() => {
    if (nodes.length === 0) return [];

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const childSet = new Set(edges.map((e) => e.target));
    const roots = nodes.filter((n) => !childSet.has(n.id));

    const result: { node: CascadeNode; depth: number }[] = [];
    const visited = new Set<string>();

    function walk(nodeId: string, depth: number) {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const node = nodeMap.get(nodeId);
      if (!node) return;
      result.push({ node, depth });
      node.children.forEach((cid) => walk(cid, depth + 1));
    }

    roots.forEach((r) => walk(r.id, 0));
    return result;
  }, [nodes, edges]);

  const handleSimulate = useCallback(() => {
    const data = scenarios[activeScenario as keyof typeof scenarios];
    const nodeMap = new Map<string, CascadeNode>(data.chain.nodes.map((n: CascadeNode) => [n.id, n]));

    const sectorBudget: Record<string, { key: keyof Profile; label: string }> = {
      energy: { key: "monthly_energy_bill", label: "Energy" },
      transport: { key: "monthly_fuel_spend", label: "Fuel" },
      food: { key: "monthly_groceries", label: "Groceries" },
      housing: { key: "monthly_rent", label: "Rent" },
    };

    const hasPersonalDescendant = (node: CascadeNode): boolean => {
      for (const cid of node.children) {
        const child = nodeMap.get(cid);
        if (child && (child.region === "personal" || hasPersonalDescendant(child))) return true;
      }
      return false;
    };

    const calculatedImpacts: PersonalImpact[] = [];
    let monthlyTotal = 0;

    for (const node of data.chain.nodes) {
      const mapping = sectorBudget[node.sector];
      const isPersonal = node.region === "personal";

      if (!mapping) {
        calculatedImpacts.push({
          node_id: node.id, event: node.event, sector: node.sector,
          monthly_cost_change: 0, description: node.event, delay_days: node.delay_days,
        });
        continue;
      }

      const spend = profile[mapping.key] as number;
      if (!spend) continue;

      if (!isPersonal && hasPersonalDescendant(node)) {
        calculatedImpacts.push({
          node_id: node.id, event: node.event, sector: node.sector,
          monthly_cost_change: 0, description: `${mapping.label}: ${node.magnitude}% (cascades further)`,
          delay_days: node.delay_days,
        });
        continue;
      }

      const pctChange = node.magnitude / 100;
      const change = node.direction === "down" ? -(spend * pctChange) : spend * pctChange;
      monthlyTotal += change;

      calculatedImpacts.push({
        node_id: node.id, event: node.event, sector: node.sector,
        monthly_cost_change: Math.round(change),
        description: `${mapping.label}: ${change >= 0 ? "+" : ""}${node.magnitude}%`,
        delay_days: node.delay_days,
      });
    }

    setImpacts(calculatedImpacts);
    setTotalMonthly(Math.round(monthlyTotal));
    setTotalAnnual(Math.round(monthlyTotal * 12));
    setSavingsRunway(
      monthlyTotal > 0 && profile.savings > 0 ? Math.round((profile.savings / monthlyTotal) * 10) / 10 : null
    );
    setSimulated(true);
  }, [profile, activeScenario]);

  const treeItems = buildTree();
  const impactMap = new Map(impacts.map((i) => [i.node_id, i]));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#21262d] px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#ff4444]/10 border border-[#ff4444]/30 flex items-center justify-center text-[#ff4444] font-black text-sm">
              D
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Domino</h1>
              <p className="text-xs text-[#8b949e]">Cascading Impact Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#8b949e]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
              Live Data
            </span>
            <a
              href="https://github.com"
              target="_blank"
              className="px-3 py-1.5 rounded border border-[#21262d] hover:border-[#8b949e] transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Scenario Selector */}
      <div className="border-b border-[#21262d] px-6 py-2">
        <div className="max-w-[1600px] mx-auto flex items-center gap-2">
          <span className="text-xs text-[#8b949e] mr-2 uppercase tracking-wider shrink-0">Scenario:</span>
          {SCENARIO_KEYS.map((key) => {
            const s = scenarios[key];
            const color = SCENARIO_COLORS[key] || "#8b949e";
            const isActive = activeScenario === key;
            return (
              <button
                key={key}
                onClick={() => loadScenario(key)}
                className="px-3 py-1.5 rounded text-xs font-medium transition-all"
                style={{
                  background: isActive ? `${color}22` : "transparent",
                  color: isActive ? color : "#8b949e",
                  border: `1px solid ${isActive ? `${color}66` : "#21262d"}`,
                }}
              >
                {s.scenario.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario Banner */}
      {scenarioInfo && (
        <div className="border-b border-[#21262d] px-6 py-3" style={{ background: `${SCENARIO_COLORS[activeScenario] || "#ff4444"}08` }}>
          <div className="max-w-[1600px] mx-auto flex items-center gap-4">
            <span
              className="shrink-0 px-2 py-0.5 rounded text-xs font-bold border"
              style={{
                background: `${SCENARIO_COLORS[activeScenario]}22`,
                color: SCENARIO_COLORS[activeScenario],
                borderColor: `${SCENARIO_COLORS[activeScenario]}44`,
              }}
            >
              ACTIVE CRISIS
            </span>
            <div className="min-w-0">
              <span className="text-sm font-bold text-[#e6edf3]">{scenarioInfo.name}</span>
              <span className="text-xs text-[#8b949e] ml-3 hidden sm:inline">{scenarioInfo.description.slice(0, 120)}...</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex max-w-[1600px] mx-auto w-full">
        {/* Left: Cascade Tree */}
        <div className="flex-1 border-r border-[#21262d] p-6 overflow-y-auto scrollbar-hide">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#8b949e]">Cascade Chain</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e]">
              {nodes.length} nodes
            </span>
          </div>
          <div className="space-y-0">
            {treeItems.map(({ node, depth }, i) => (
              <DominoNode
                key={node.id}
                node={node}
                depth={depth}
                index={i}
                isActive={selectedNode === node.id}
                personalImpact={impactMap.get(node.id)}
                onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
              />
            ))}
          </div>
        </div>

        {/* Right: Profile + Impact */}
        <div className="w-[380px] shrink-0 p-6 overflow-y-auto scrollbar-hide">
          {!simulated ? (
            <ProfilePanel profile={profile} onChange={setProfile} onSimulate={handleSimulate} />
          ) : (
            <div className="space-y-6">
              <ImpactSummary
                totalMonthly={totalMonthly}
                totalAnnual={totalAnnual}
                savingsRunway={savingsRunway}
                impacts={impacts}
              />
              <button
                onClick={() => setSimulated(false)}
                className="w-full py-2 rounded text-xs text-[#8b949e] border border-[#21262d] hover:border-[#8b949e] transition-colors"
              >
                Edit Profile
              </button>
            </div>
          )}

          {/* Node Detail */}
          {selectedNode && (
            <div className="mt-6 pt-6 border-t border-[#21262d]">
              {(() => {
                const node = nodes.find((n) => n.id === selectedNode);
                if (!node) return null;
                const s = getSectorStyle(node.sector);
                return (
                  <div>
                    <h4 className="text-xs text-[#8b949e] uppercase tracking-wider mb-2">Node Detail</h4>
                    <div className="rounded-lg border p-4" style={{ borderColor: `${s.color}44`, background: s.bg }}>
                      <div className="text-sm font-bold mb-2" style={{ color: s.color }}>{node.event}</div>
                      <p className="text-xs text-[#8b949e] mb-3">{node.detail}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded bg-[#0d1117] p-2">
                          <div className="text-[#8b949e]">Magnitude</div>
                          <div className="font-bold" style={{ color: s.color }}>{node.magnitude}{node.unit === "%" ? "%" : ` ${node.unit}`}</div>
                        </div>
                        <div className="rounded bg-[#0d1117] p-2">
                          <div className="text-[#8b949e]">Delay</div>
                          <div className="font-bold text-white">{node.delay_days} days</div>
                        </div>
                        <div className="rounded bg-[#0d1117] p-2">
                          <div className="text-[#8b949e]">Confidence</div>
                          <div className="font-bold text-white">{(node.confidence * 100).toFixed(0)}%</div>
                        </div>
                        <div className="rounded bg-[#0d1117] p-2">
                          <div className="text-[#8b949e]">Duration</div>
                          <div className="font-bold text-white">{node.duration_days}d</div>
                        </div>
                      </div>
                      {node.source && (
                        <div className="mt-2 text-xs text-[#8b949e]">Source: {node.source}</div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
