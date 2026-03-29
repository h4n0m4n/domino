export interface ScenarioNode {
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

export interface ScenarioEdge {
  source: string;
  target: string;
}

export interface ScenarioData {
  scenario: { name: string; description: string; date?: string; tags?: string[] };
  chain: { nodes: ScenarioNode[]; edges: ScenarioEdge[] };
}

function buildEdges(nodes: ScenarioNode[]): ScenarioEdge[] {
  const edges: ScenarioEdge[] = [];
  for (const node of nodes) {
    for (const childId of node.children) {
      edges.push({ source: node.id, target: childId });
    }
  }
  return edges;
}

const hormuzNodes: ScenarioNode[] = [
  { id: "hormuz_blocked", event: "Strait of Hormuz Blocked", detail: "Tanker traffic collapsed by over 90%. 20% of global oil supply and 30% of global fertilizer trade disrupted.", sector: "security", region: "middle-east", magnitude: 90, unit: "% traffic drop", direction: "blocked", delay_days: 0, duration_days: 180, confidence: 0.95, source: "Reuters, IEA March 2026", children: ["oil_supply_drop", "lng_price_surge", "fertilizer_shortage"] },
  { id: "oil_supply_drop", event: "Global Oil Supply -8M barrels/day", detail: "8% of world demand removed. Gulf countries cut production 10M+ bpd.", sector: "energy", region: "global", magnitude: 8, unit: "% supply cut", direction: "down", delay_days: 1, duration_days: 180, confidence: 0.95, source: "IEA March 2026", children: ["oil_price_surge", "fuel_price_spike"] },
  { id: "oil_price_surge", event: "Brent Crude Surges to $119/barrel", detail: "Oil prices jumped nearly 40% from pre-conflict levels.", sector: "energy", region: "global", magnitude: 40, unit: "%", direction: "up", delay_days: 3, duration_days: 180, confidence: 0.95, source: "Reuters, World Bank", children: ["transport_cost_rise", "manufacturing_cost"] },
  { id: "fuel_price_spike", event: "Retail Fuel Prices Spike +35%", detail: "Gasoline prices surge globally. Turkey: benzin 48 to 67 TRY/L.", sector: "transport", region: "global", magnitude: 35, unit: "%", direction: "up", delay_days: 7, duration_days: 180, confidence: 0.9, source: "Reuters March 2026", children: ["personal_fuel_cost"] },
  { id: "personal_fuel_cost", event: "Your Monthly Fuel Cost Increases", detail: "Direct impact on personal transportation budget.", sector: "transport", region: "personal", magnitude: 35, unit: "%", direction: "up", delay_days: 7, duration_days: 180, confidence: 0.9, source: "Calculated", children: [] },
  { id: "lng_price_surge", event: "LNG Prices Surge +66%", detail: "Liquefied natural gas prices nearly doubled.", sector: "energy", region: "global", magnitude: 66, unit: "%", direction: "up", delay_days: 7, duration_days: 180, confidence: 0.9, source: "World Bank", children: ["electricity_bill_rise"] },
  { id: "electricity_bill_rise", event: "Electricity & Heating Bills +30%", detail: "Natural gas powers ~40% of electricity. Bills rise with 1-3 month lag.", sector: "energy", region: "global", magnitude: 30, unit: "%", direction: "up", delay_days: 45, duration_days: 180, confidence: 0.8, source: "OECD estimates", children: [] },
  { id: "fertilizer_shortage", event: "Global Fertilizer Supply -30%", detail: "30% of fertilizer trade transits Hormuz. Prices surged 50%.", sector: "food", region: "global", magnitude: 50, unit: "% price rise", direction: "up", delay_days: 14, duration_days: 365, confidence: 0.9, source: "FAO, Bloomberg", children: ["wheat_price_rise", "crop_yield_drop"] },
  { id: "wheat_price_rise", event: "Wheat & Grain Prices +22%", detail: "Fertilizer costs pass through to grain prices.", sector: "food", region: "global", magnitude: 22, unit: "%", direction: "up", delay_days: 60, duration_days: 365, confidence: 0.85, source: "FAO, Helios AI", children: ["bread_price", "food_general"] },
  { id: "crop_yield_drop", event: "Crop Yields Decline -15%", detail: "Nitrogen-intensive crops exposed during planting season.", sector: "food", region: "global", magnitude: 15, unit: "% yield drop", direction: "down", delay_days: 120, duration_days: 365, confidence: 0.75, source: "AgFunder News", children: ["food_general"] },
  { id: "bread_price", event: "Bread, Pasta, Flour Prices +18%", detail: "Wheat-based staples directly affected.", sector: "food", region: "global", magnitude: 18, unit: "%", direction: "up", delay_days: 90, duration_days: 365, confidence: 0.85, source: "Helios AI", children: ["grocery_bill_impact"] },
  { id: "food_general", event: "Overall Food Prices +15%", detail: "Combined fertilizer + transport + yield impact.", sector: "food", region: "global", magnitude: 15, unit: "%", direction: "up", delay_days: 120, duration_days: 365, confidence: 0.8, source: "Helios AI", children: ["grocery_bill_impact"] },
  { id: "grocery_bill_impact", event: "Your Grocery Bill Increases", detail: "Direct impact on food budget.", sector: "food", region: "personal", magnitude: 18, unit: "%", direction: "up", delay_days: 90, duration_days: 365, confidence: 0.8, source: "Calculated", children: [] },
  { id: "transport_cost_rise", event: "Commercial Transport +25%", detail: "Trucking, shipping, freight costs surge.", sector: "transport", region: "global", magnitude: 25, unit: "%", direction: "up", delay_days: 14, duration_days: 180, confidence: 0.85, source: "OECD, PMI data", children: ["food_general"] },
  { id: "manufacturing_cost", event: "Manufacturing Costs Rise, PMIs Fall", detail: "Eurozone PMI fell to 10-month low. Stagflation risk.", sector: "employment", region: "global", magnitude: 5, unit: "% cost rise", direction: "up", delay_days: 30, duration_days: 365, confidence: 0.8, source: "Reuters", children: [] },
];

const dollarNodes: ScenarioNode[] = [
  { id: "dollar_drop", event: "Dollar Reserve Share Falls Below 50%", detail: "First time since WWII. BRICS mBridge bypasses SWIFT.", sector: "currency", region: "global", magnitude: 30, unit: "% decline", direction: "down", delay_days: 0, duration_days: 730, confidence: 0.7, source: "CFO Times 2026", children: ["gold_surge", "dollar_index_fall", "us_debt_spiral"] },
  { id: "gold_surge", event: "Gold Surges Past $6,000/oz", detail: "Central banks accelerate purchases. 77% plan to increase reserves.", sector: "finance", region: "global", magnitude: 50, unit: "%", direction: "up", delay_days: 30, duration_days: 365, confidence: 0.65, source: "BIS data", children: ["crypto_surge"] },
  { id: "crypto_surge", event: "Crypto Markets Rally as Dollar Alternative", detail: "Bitcoin and tokenized gold see massive inflows.", sector: "finance", region: "global", magnitude: 80, unit: "%", direction: "up", delay_days: 14, duration_days: 365, confidence: 0.5, source: "On-chain data", children: [] },
  { id: "dollar_index_fall", event: "Dollar Index (DXY) Drops 15%", detail: "Major currencies strengthen. Yuan rises to 5%+ reserve share.", sector: "currency", region: "global", magnitude: 15, unit: "%", direction: "down", delay_days: 7, duration_days: 365, confidence: 0.6, source: "Forex markets", children: ["emerging_pressure", "import_cost"] },
  { id: "emerging_pressure", event: "Emerging Market Currency Volatility", detail: "Turkish lira, peso, pound face pressure despite dollar weakness.", sector: "currency", region: "emerging", magnitude: 20, unit: "% volatility", direction: "up", delay_days: 14, duration_days: 365, confidence: 0.7, source: "Historical patterns", children: ["local_inflation"] },
  { id: "local_inflation", event: "EM Inflation Accelerates to 35%+", detail: "Currency volatility feeds into consumer prices.", sector: "currency", region: "emerging", magnitude: 35, unit: "% CPI", direction: "up", delay_days: 60, duration_days: 365, confidence: 0.7, source: "TCMB, IMF", children: ["purchasing_power"] },
  { id: "purchasing_power", event: "Your Purchasing Power Erodes", detail: "Salary flat while prices rise. Real income drops 25%.", sector: "currency", region: "personal", magnitude: 25, unit: "% real loss", direction: "down", delay_days: 90, duration_days: 365, confidence: 0.7, source: "Calculated", children: [] },
  { id: "import_cost", event: "Import Costs Rise +12%", detail: "Trade disruption raises costs for importing nations.", sector: "food", region: "global", magnitude: 12, unit: "%", direction: "up", delay_days: 30, duration_days: 365, confidence: 0.65, source: "WTO data", children: ["food_import"] },
  { id: "food_import", event: "Food Import Bills Rise +15%", detail: "Net food importers face higher bills.", sector: "food", region: "emerging", magnitude: 15, unit: "%", direction: "up", delay_days: 60, duration_days: 365, confidence: 0.7, source: "FAO", children: ["grocery"] },
  { id: "grocery", event: "Your Grocery Spending Increases", detail: "Import-dependent food items more expensive.", sector: "food", region: "personal", magnitude: 15, unit: "%", direction: "up", delay_days: 90, duration_days: 365, confidence: 0.7, source: "Calculated", children: [] },
  { id: "us_debt_spiral", event: "US Debt Servicing Costs Explode", detail: "Interest exceeds $1.2T/year. Budget squeeze.", sector: "finance", region: "us", magnitude: 20, unit: "% of budget", direction: "up", delay_days: 0, duration_days: 730, confidence: 0.8, source: "US Treasury, CBO", children: ["risk_repricing"] },
  { id: "risk_repricing", event: "Global Markets Correct 20%+", detail: "Safe-haven flight. EM bonds sell off.", sector: "finance", region: "global", magnitude: 20, unit: "% decline", direction: "down", delay_days: 30, duration_days: 180, confidence: 0.55, source: "Historical analysis", children: [] },
];

const aiNodes: ScenarioNode[] = [
  { id: "ai_threshold", event: "Agentic AI Automates 40% of Knowledge Tasks", detail: "AI agents plan, execute autonomously. 62% of enterprises scaling.", sector: "technology", region: "global", magnitude: 40, unit: "% tasks", direction: "up", delay_days: 0, duration_days: 730, confidence: 0.8, source: "WEF 2025, Forrester", children: ["entry_collapse", "mid_pressure", "degree_devalue"] },
  { id: "entry_collapse", event: "Entry-Level Tech Hiring -50%", detail: "Junior dev, data entry, support, content roles automated first.", sector: "employment", region: "global", magnitude: 50, unit: "% cut", direction: "down", delay_days: 0, duration_days: 730, confidence: 0.85, source: "LinkedIn, AI Displacement Index", children: ["youth_unemp", "wage_stagnate"] },
  { id: "mid_pressure", event: "Mid-Level Roles Under Pressure", detail: "Accountants, analysts, PMs face augmentation. 41% leaders cut headcount.", sector: "employment", region: "global", magnitude: 25, unit: "% at risk", direction: "down", delay_days: 90, duration_days: 730, confidence: 0.7, source: "McKinsey", children: ["wage_stagnate", "spending_drop"] },
  { id: "degree_devalue", event: "University Degrees Lose Value", detail: "Employment rate 78% to 54%. Knowledge half-life: 18-24 months.", sector: "technology", region: "global", magnitude: 30, unit: "% value loss", direction: "down", delay_days: 30, duration_days: 730, confidence: 0.8, source: "Bipartisan Policy Center", children: ["skills_pivot"] },
  { id: "youth_unemp", event: "Youth Unemployment Surges 20%+", detail: "22 applicants per job. Turkey youth at 14.9%.", sector: "employment", region: "global", magnitude: 20, unit: "%", direction: "up", delay_days: 60, duration_days: 730, confidence: 0.75, source: "ILO", children: ["mental_health", "your_risk"] },
  { id: "wage_stagnate", event: "Wages Stagnate Despite Productivity", detail: "Headcount -12%, revenue +8.3%. Gains don't reach workers.", sector: "employment", region: "global", magnitude: 8, unit: "% real decline", direction: "down", delay_days: 120, duration_days: 730, confidence: 0.75, source: "Enterprise data", children: ["spending_drop"] },
  { id: "spending_drop", event: "Consumer Spending Contracts", detail: "52% can't pay bills. Credit card debt rising.", sector: "finance", region: "global", magnitude: 8, unit: "%", direction: "down", delay_days: 180, duration_days: 365, confidence: 0.7, source: "Gallup 2026", children: ["biz_close"] },
  { id: "biz_close", event: "Small Business Closures Accelerate", detail: "82% cite cash flow. Main streets hollow out.", sector: "employment", region: "global", magnitude: 15, unit: "% increase", direction: "up", delay_days: 240, duration_days: 365, confidence: 0.65, source: "Fed Survey 2026", children: [] },
  { id: "skills_pivot", event: "Mass Reskilling Demand Emerges", detail: "44% of skills need updating. New roles forming.", sector: "technology", region: "global", magnitude: 44, unit: "% gap", direction: "up", delay_days: 30, duration_days: 730, confidence: 0.85, source: "WEF", children: ["new_roles"] },
  { id: "new_roles", event: "170M New Jobs Form by 2030", detail: "Agent Orchestrators, AI Calibrators, Autonomy Designers.", sector: "employment", region: "global", magnitude: 170, unit: "M roles", direction: "up", delay_days: 180, duration_days: 1460, confidence: 0.7, source: "WEF", children: [] },
  { id: "mental_health", event: "Loneliness & Anxiety Epidemic", detail: "1 in 6 lonely. 3x depression in young adults. $406B toll.", sector: "health", region: "global", magnitude: 33, unit: "% adults", direction: "up", delay_days: 90, duration_days: 730, confidence: 0.8, source: "WHO, Edelman 2026", children: [] },
  { id: "your_risk", event: "Your Job Automation Risk", detail: "Individual risk based on task composition and industry.", sector: "employment", region: "personal", magnitude: 45, unit: "% avg risk", direction: "up", delay_days: 0, duration_days: 730, confidence: 0.6, source: "AI Exposure (45.8M at high risk)", children: [] },
];

const pandemicNodes: ScenarioNode[] = [
  { id: "pandemic_declared", event: "WHO Declares H5N1 Pandemic", detail: "Novel avian flu variant achieves R0 of 2.5+. Sustained clusters spread to 30+ countries.", sector: "health", region: "global", magnitude: 100, unit: "% alert", direction: "disrupted", delay_days: 0, duration_days: 365, confidence: 0.35, source: "Hypothetical (WHO risk)", children: ["travel_restrict", "supply_shock", "market_panic"] },
  { id: "travel_restrict", event: "Global Travel Restrictions", detail: "International air travel drops 60-80%. Border closures across Asia and Europe.", sector: "transport", region: "global", magnitude: 70, unit: "% reduction", direction: "down", delay_days: 7, duration_days: 180, confidence: 0.6, source: "COVID precedent", children: ["tourism_hit", "service_hit"] },
  { id: "tourism_hit", event: "Tourism & Hospitality Collapse", detail: "Hotels, restaurants, airlines face 50% revenue loss. Turkey tourism at risk.", sector: "employment", region: "global", magnitude: 50, unit: "% revenue loss", direction: "down", delay_days: 14, duration_days: 270, confidence: 0.65, source: "UNWTO, COVID precedent", children: ["unemployment"] },
  { id: "supply_shock", event: "Global Supply Chains Disrupted", detail: "Factory closures in Asia. Already fragile from Hormuz crisis.", sector: "transport", region: "global", magnitude: 30, unit: "% disruption", direction: "disrupted", delay_days: 14, duration_days: 270, confidence: 0.6, source: "Supply chain analysis", children: ["medicine", "food_disruption"] },
  { id: "medicine", event: "Medicine & Medical Supply Shortage", detail: "80% of antibiotic ingredients from Asia. Vaccine ramp is slow.", sector: "health", region: "global", magnitude: 40, unit: "% supply drop", direction: "down", delay_days: 30, duration_days: 180, confidence: 0.55, source: "WHO supply reports", children: [] },
  { id: "food_disruption", event: "Compound Food Crisis (War + Pandemic)", detail: "Pandemic + Hormuz + fertilizer = triple threat to food security.", sector: "food", region: "global", magnitude: 25, unit: "% price rise", direction: "up", delay_days: 30, duration_days: 365, confidence: 0.55, source: "FAO compound modeling", children: ["your_food"] },
  { id: "your_food", event: "Your Food Costs Surge", detail: "Compound crisis creates severe household budget pressure.", sector: "food", region: "personal", magnitude: 25, unit: "%", direction: "up", delay_days: 45, duration_days: 365, confidence: 0.55, source: "Calculated", children: [] },
  { id: "market_panic", event: "Financial Markets Crash 25%", detail: "VIX spikes above 50. Already fragile markets face pandemic shock.", sector: "finance", region: "global", magnitude: 25, unit: "% decline", direction: "down", delay_days: 3, duration_days: 180, confidence: 0.6, source: "COVID crash precedent", children: ["credit_freeze"] },
  { id: "credit_freeze", event: "Credit Markets Tighten Sharply", detail: "Banks restrict lending. Mortgage rates spike.", sector: "finance", region: "global", magnitude: 30, unit: "% tightening", direction: "up", delay_days: 14, duration_days: 270, confidence: 0.55, source: "2020 credit analysis", children: [] },
  { id: "service_hit", event: "Service Sector Employment Drops", detail: "59.3% of Turkish employment in services. Lockdowns hit hardest.", sector: "employment", region: "emerging", magnitude: 20, unit: "% at risk", direction: "down", delay_days: 14, duration_days: 270, confidence: 0.6, source: "TurkStat", children: ["unemployment"] },
  { id: "unemployment", event: "Compound Unemployment Surge to 35%+", detail: "War + AI + pandemic = perfect storm. Turkey real unemployment could exceed 35%.", sector: "employment", region: "global", magnitude: 35, unit: "% real", direction: "up", delay_days: 60, duration_days: 365, confidence: 0.5, source: "Compound crisis projection", children: [] },
];

export const scenarios: Record<string, ScenarioData> = {
  hormuz_strait: {
    scenario: { name: "Hormuz Strait Blockade", description: "The Strait of Hormuz blocked due to Iran-Israel conflict. Largest oil disruption in history.", date: "2026-02-28", tags: ["war", "energy", "oil", "food"] },
    chain: { nodes: hormuzNodes, edges: buildEdges(hormuzNodes) },
  },
  dollar_crisis: {
    scenario: { name: "Dollar Reserve Collapse", description: "US dollar falls below 50% global reserves. De-dollarization accelerates. Gold breaches $6,000/oz.", date: "2026-06-01", tags: ["dollar", "currency", "gold", "brics"] },
    chain: { nodes: dollarNodes, edges: buildEdges(dollarNodes) },
  },
  ai_displacement: {
    scenario: { name: "AI Employment Displacement", description: "Agentic AI automates 40% of knowledge work. 92M jobs displaced, 170M new ones forming.", date: "2026-07-01", tags: ["ai", "employment", "automation", "skills"] },
    chain: { nodes: aiNodes, edges: buildEdges(aiNodes) },
  },
  pandemic_v2: {
    scenario: { name: "Next Pandemic (H5N1)", description: "Novel H5N1 variant achieves human transmission. Compound crisis atop war + AI disruption.", date: "2026-09-01", tags: ["pandemic", "health", "supply-chain"] },
    chain: { nodes: pandemicNodes, edges: buildEdges(pandemicNodes) },
  },
};

export default scenarios.hormuz_strait;
