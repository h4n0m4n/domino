# Domino — Launch Posts (Copy-Paste Ready)

Generated: 2026-03-30

---

## 1. HACKER NEWS — Show HN

**Submit to:** https://news.ycombinator.com/submit
**Type:** Show HN

**Title:**
```
Show HN: Domino – See how the Iran war cascades into your grocery bill
```

**URL:**
```
https://github.com/aykutturksoy5-maker/domino
```

**First Comment (post immediately after submitting):**
```
Hi HN — I built this because I was frustrated reading 50 news articles a day about the Iran war, oil prices, and the dollar crisis, but still had no idea what it actually meant for MY finances.

Domino is an open-source cascading impact engine. You give it a global event (war, pandemic, currency crash) and it models the full domino chain down to your personal monthly cost.

Example: "Strait of Hormuz blocked" → 15-step cascade → your grocery bill +18% within 90 days, fuel +35% within 7 days.

How it works:
- Each crisis is modeled as a DAG (directed acyclic graph)
- Nodes carry magnitude, delay, confidence, and real data citations
- Your personal profile translates macro events into your wallet
- 9 built-in scenarios with 100+ nodes total

Tech: Python 3.11 + FastAPI backend, Next.js + React Flow frontend. All data sources are free (GDELT, Yahoo Finance, World Bank). Optional AI cascade generation via Ollama (local, free).

Try it: git clone, pip install -e ., domino simulate scenarios/hormuz_strait.json

What I'd love feedback on:
1. Are the cascade models realistic?
2. What scenarios would you add for your region?
3. Should I add compound mode (stack multiple crises)?

Live demo: https://domino-crisis.vercel.app
GitHub: https://github.com/aykutturksoy5-maker/domino
```

---

## 2. REDDIT POSTS

### 2a. r/dataisbeautiful

**Title:**
```
[OC] How the Strait of Hormuz blockade cascades through 15 steps to hit your grocery bill — interactive crisis simulation
```

**Body:**
```
I built an open-source tool that visualizes how global crises cascade into personal budgets.

This visualization shows the Hormuz Strait blockade (Feb 2026) — how blocking 20% of global oil triggers a 15-step domino chain:

Oil supply -8% → Crude +40% → Transport +25% → Fertilizer -30% → Wheat +22% → Bread +18% → YOUR grocery bill +₺1,440/month

The tool has 9 crisis scenarios with 100+ cascade nodes, each backed by real data (Reuters, IEA, FAO, World Bank).

Tools: Python cascade engine + Next.js/React Flow visualization

Interactive version: https://github.com/aykutturksoy5-maker/domino

Data sources: IEA, FAO, World Bank, Reuters, GDELT (all free, no API keys needed)
```

### 2b. r/economics

**Title:**
```
I built an open-source tool that models how geopolitical events cascade into household budgets — 9 crisis scenarios with real data
```

**Body:**
```
As someone trying to understand compound crisis economics, I was frustrated that macro data never translated to "what does this mean for MY wallet?"

So I built Domino — an open-source cascading impact simulation engine. It takes a trigger event and models the full transmission chain to personal budgets.

Example (Hormuz Strait Blockade):
- Trigger: Strait blocked → 8M barrels/day supply cut
- Oil: Brent crude +40% (3 days) [Source: Reuters, World Bank]
- Transport: Commercial freight +25% (14 days) [Source: OECD]
- Fertilizer: Supply -30%, prices +50% (14 days) [Source: FAO, Bloomberg]
- Food: Wheat +22% (60 days), Bread +18% (90 days) [Source: FAO]
- Personal: Fuel +₺1,050/mo, Energy +₺750/mo, Food +₺1,440/mo

9 scenarios: Hormuz, Dollar collapse, AI displacement, H5N1 pandemic, Taiwan chips, climate crop failure, Turkey earthquake, crypto crash, energy transition.

Each node carries magnitude, delay, confidence score, and data citation.

Would love feedback from economists on the transmission models.

GitHub (MIT license): https://github.com/aykutturksoy5-maker/domino
```

### 2c. r/Python

**Title:**
```
I built a DAG-based crisis cascade simulation engine in Python — models how wars and crises hit your personal budget
```

**Body:**
```
Sharing a project I've been working on: Domino — a cascading impact simulation engine.

Core engine is Python 3.11 + Pydantic. Each crisis is modeled as a directed acyclic graph where nodes carry quantified impacts with delays and confidence scores.

Tech highlights:
- CascadeEngine with DAG-based chain modeling
- Personal impact calculator that translates macro → micro
- 9 built-in scenarios with 100+ nodes
- FastAPI backend (7 endpoints)
- CLI with rich terminal output
- Optional AI cascade generation via Ollama
- 12/12 tests passing

```python
from cascade.core import CascadeEngine, CascadeNode, CascadeChain

engine = CascadeEngine()
chain = engine.create_chain()

chain.add_node(CascadeNode(
    id="earthquake", event="Major earthquake hits Istanbul",
    sector=Sector.SECURITY, magnitude=7.2, unit="richter",
    direction=ImpactDirection.DISRUPTED,
))

summary = engine.summary(profile={"monthly_rent": 15000, "savings": 200000})
print(f"Monthly impact: TRY {summary.total_monthly_impact:+,.0f}")
```

Install: `pip install -e .`
12 tests covering edge cases (empty profiles, negative values, extreme inputs).

GitHub: https://github.com/aykutturksoy5-maker/domino
```

### 2d. r/geopolitics

**Title:**
```
Open-source tool: Model how the Iran-Israel conflict cascades into household budgets in 15 steps
```

**Body:**
```
I built a simulation engine that models cascading impacts of geopolitical events on personal finances, using real data from IEA, FAO, World Bank, and Reuters.

The Hormuz Strait blockade scenario:

Strait blocked → Oil supply -8M bpd → Crude +40% → Transport +25% → Fertilizer supply -30% → Wheat +22% → Food prices +15-18%

Each step has:
- Quantified magnitude (from official sources)
- Time delay (when the domino falls)
- Confidence score (how certain the link)
- Duration estimate

9 scenarios covering: Hormuz war, dollar de-dollarization, AI displacement, pandemic, Taiwan semiconductor crisis, climate crop failure, Turkey earthquake, crypto contagion, energy transition.

All data sourced from Reuters, IEA, FAO, World Bank, IMF, BIS. MIT license, fully open source.

I'd especially value feedback on:
- Missing transmission channels
- Regional scenarios (EU, South Asia, Africa?)
- Compound effects between crises

GitHub: https://github.com/aykutturksoy5-maker/domino
```

### 2e. r/webdev

**Title:**
```
Built a crisis impact dashboard with Next.js + Canvas — animated cascade visualization with 100+ nodes
```

**Body:**
```
I built a crisis simulation dashboard that visualizes how global events cascade into personal budgets. Sharing the frontend approach:

Stack:
- Next.js 15 (App Router)
- Tailwind CSS
- Custom canvas-based edge rendering with bezier curves
- Animated dashed lines with requestAnimationFrame
- Custom DAG layout engine (no external graph library)

Features:
- 9 interactive scenario selectors
- Node cards with gradient backgrounds, glow effects
- Confidence bars, magnitude indicators
- Personal impact calculator with real-time simulation
- Floating impact summary panel
- Responsive side panel with breakdown

The interesting challenge was rendering 100+ connected nodes with smooth animations without React Flow or D3 — just positioned divs + a canvas overlay for edges.

All scenario data is embedded (no backend needed for visualization), making it perfect for static deployment.

GitHub: https://github.com/aykutturksoy5-maker/domino
```

---

## 3. TWITTER/X THREAD

**Post as thread (each section = one tweet):**

**Tweet 1:**
```
I built an open-source engine that shows how global crises cascade into your daily life.

The Iran war blocked the Strait of Hormuz on Feb 28.

Here's the 15-step domino chain from that event to your kitchen table:

🧵👇
```

**Tweet 2:**
```
1/ Hormuz blocked → 90% of tanker traffic stops
2/ Global oil supply drops 8M barrels/day
3/ Brent crude surges to $119/barrel (+40%)
4/ Fuel prices spike +35% within 7 days
5/ YOUR fuel cost: +₺1,050/month
```

**Tweet 3:**
```
6/ LNG prices surge +66%
7/ Electricity bills +30% (45-day lag)
8/ YOUR energy cost: +₺750/month

9/ Fertilizer supply -30%
10/ Wheat prices +22%
11/ Bread & staples +18%
12/ YOUR grocery bill: +₺1,440/month
```

**Tweet 4:**
```
Total personal hit: ₺+3,000/month — ₺+36,000/year

Your savings last 41.7 months instead of 50.

And this is just ONE of 9 crisis scenarios in Domino.
```

**Tweet 5:**
```
Domino has 9 real scenarios:
• Hormuz war → energy + food
• Dollar collapse → currency + inflation
• AI displacement → jobs + wages
• H5N1 pandemic → health + supply chain
• Taiwan chip crisis → electronics + autos
• Climate crop failure → agriculture
• Istanbul earthquake → housing + insurance
• Crypto crash → finance + VC
• Energy transition → renewables + jobs
```

**Tweet 6:**
```
It's 100% open source (MIT). You can:

✅ Run it with YOUR financial numbers
✅ Create scenarios for YOUR country
✅ Use AI to generate cascades from any event (local Ollama, free)

Built with Python + FastAPI + Next.js

GitHub: github.com/aykutturksoy5-maker/domino

Star it if this is useful. ⭐
```

---

## 4. DEV.TO ARTICLE

**Title:**
```
I built an open-source engine that models how global crises hit your wallet
```

**Tags:** `opensource`, `python`, `nextjs`, `finance`

**Body:**
```markdown
# I built an open-source engine that models how global crises hit your wallet

I was frustrated reading news about wars, oil prices, and currency crashes without knowing what any of it meant for **my** personal finances.

So I built **Domino** — an open-source cascading impact simulation engine.

## The idea

Every crisis follows a domino chain. When the Strait of Hormuz was blocked in February 2026:

```
Hormuz blocked → Oil -8% → Crude +40% → Transport +25%
                                       → Fuel +35% → YOUR fuel +₺1,050/mo
               → LNG +66% → Electricity +30% → YOUR energy +₺750/mo
               → Fertilizer -30% → Wheat +22% → Bread +18% → YOUR food +₺1,440/mo
```

Total: **₺+3,000/month** — and that's just one scenario.

## How it works

Each crisis is modeled as a **directed acyclic graph (DAG)**:

- **Trigger Event** → Something happens (war, pandemic, crash)
- **Cascade Chain** → Ripples through sectors: energy → transport → food → employment
- **Personal Translation** → Each ripple hits YOUR finances using your profile
- **Time Modeling** → Each domino has a delay and confidence score

Every node carries:
- Magnitude (quantified impact, e.g. +40%)
- Delay (when this domino falls)
- Confidence (how certain, 0-1)
- Source (real data citation)

## Tech stack

| Layer | Technology |
|-------|-----------|
| Engine | Python 3.11+ / Pydantic |
| API | FastAPI (7 endpoints) |
| AI | Ollama (local, free) |
| Frontend | Next.js / Tailwind CSS |
| Data | Free APIs (GDELT, Yahoo Finance, World Bank) |

## 9 built-in scenarios

1. Hormuz Strait Blockade (energy + food)
2. Dollar Reserve Collapse (currency + finance)
3. AI Employment Displacement (jobs + technology)
4. Next Pandemic H5N1 (health + supply chain)
5. Taiwan Semiconductor Crisis (chips + autos)
6. Climate Crop Failure (agriculture + inflation)
7. Marmara Earthquake (housing + insurance)
8. Crypto Crash Contagion (finance + VC)
9. Energy Transition (renewables + jobs)

## Try it

```bash
git clone https://github.com/aykutturksoy5-maker/domino.git
cd domino
pip install -e .
domino simulate scenarios/hormuz_strait.json \
  --profile '{"monthly_fuel_spend": 3000, "monthly_groceries": 8000, "savings": 150000}'
```

## What's next

- Compound scenario mode (stack multiple crises)
- Historical accuracy tracking
- Community scenario marketplace
- MCP server for AI agent integration

**Star it if this resonates with you**: [github.com/aykutturksoy5-maker/domino](https://github.com/aykutturksoy5-maker/domino)

---

*Built during the compound crisis of 2026. Because everyone deserves a compass in the storm.*
```

---

## 5. PRODUCT HUNT

**Submit:** https://www.producthunt.com/posts/new

**Name:** Domino
**Tagline:** From global events to your kitchen table
**Description:**
```
Open-source engine that simulates how wars, pandemics, and economic crises cascade into your personal budget.

Give it a crisis (Hormuz war, dollar crash, AI displacement) and see the full domino chain — from the trigger event through 15 steps to YOUR monthly cost.

9 real scenarios, 100+ cascade nodes, all backed by data from Reuters, IEA, FAO, World Bank.

Built with Python + Next.js. MIT license. Free forever.
```

**Topics:** Open Source, Developer Tools, Finance, Data Visualization

---

## 6. LINKEDIN POST

```
I just open-sourced Domino — a cascading impact simulation engine.

The problem: We all read about wars, oil prices, and economic crises. But nobody knows what it means for THEIR personal finances.

Domino bridges that gap. It takes a global event and models the full domino chain to your wallet:

"Strait of Hormuz blocked" →
→ Oil supply -8% (1 day)
→ Crude +40% (3 days)
→ Transport +25% (14 days)
→ Food prices +18% (90 days)
→ YOUR grocery bill +₺1,440/month

9 crisis scenarios. 100+ cascade nodes. Real data from IEA, FAO, World Bank.

Open source (MIT). Built with Python + Next.js.

Would love to connect with:
🔹 Economists who can validate cascade models
🔹 Developers who want to contribute
🔹 Anyone who wants to build a scenario for their country

GitHub: https://github.com/aykutturksoy5-maker/domino

#opensource #fintech #economics #geopolitics #python #nextjs
```

---

## POSTING SCHEDULE

| Day | Platform | Time (Turkey) | Priority |
|-----|----------|---------------|----------|
| Tue | Hacker News | 15:00-17:00 | #1 |
| Tue | Twitter thread | 16:00 | #2 |
| Tue | r/dataisbeautiful | 17:00 | #3 |
| Tue | r/economics | 18:00 | #4 |
| Wed | r/Python | 15:00 | #5 |
| Wed | r/geopolitics | 16:00 | #6 |
| Wed | r/webdev | 17:00 | #7 |
| Wed | LinkedIn | 18:00 | #8 |
| Thu | Dev.to article | 15:00 | #9 |
| Fri | Product Hunt | 08:00 | #10 |

**KEY RULES:**
1. Post HN first — it drives the most GitHub stars
2. Post your HN first comment IMMEDIATELY (within 30 seconds)
3. Reply to EVERY comment on HN within 2 hours
4. On Reddit, engage genuinely — don't just dump links
5. On Twitter, include a screenshot/GIF of the dashboard
6. Respond to ALL GitHub issues within 24 hours
