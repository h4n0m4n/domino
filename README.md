<div align="center">

# Domino

### From global events to your kitchen table.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Tests](https://img.shields.io/badge/tests-12%2F12%20passing-brightgreen.svg)](#)
[![Scenarios](https://img.shields.io/badge/scenarios-9%20crises-red.svg)](#built-in-scenarios)
[![Next.js](https://img.shields.io/badge/frontend-Next.js-black.svg)](https://nextjs.org/)

An open-source cascading impact simulation engine that models how wars, energy shocks, and economic crises ripple through the world economy — and land on **your** doorstep.

**[Live Demo](https://domino-crisis.vercel.app)** · **[Quick Start](#quick-start)** · **[Scenarios](#built-in-scenarios)** · **[Build Your Own](#build-your-own-scenario)** · **[Contributing](docs/contributing.md)** · **[Discussions](https://github.com/aykutturksoy5-maker/domino/discussions)**

</div>

---

```
  STRAIT OF HORMUZ BLOCKED (Feb 28, 2026)
  │
  ├─→ Oil supply -8% ─→ Brent crude +40% ─→ Transport +25% ─→ Food prices +15%
  │                    └─→ Fuel +35% ──────────────────────→ YOUR FUEL: +₺1,050/mo
  │
  ├─→ LNG +66% ───────→ Electricity +30% ─────────────────→ YOUR ENERGY: +₺750/mo
  │
  └─→ Fertilizer -30% ─→ Wheat +22% ─→ Bread +18% ───────→ YOUR FOOD: +₺1,440/mo

  ─── YOUR TOTAL: ₺+4,890/month · ₺+58,680/year · Savings last 30.7 months ───
```

> *"The Strait of Hormuz was blocked on February 28, 2026. Domino shows how that single event cascades through 15 steps to hit your wallet within 90 days."*

## The Problem

The world is in compound crisis. In March 2026 alone:

- **Oil prices surged 40%** after the largest supply disruption in history
- **Food prices rising 12-18%** as fertilizer trade collapsed
- **Gold hit $5,300/oz** — retail buying tripled in 6 months
- **92 million jobs** will be displaced by AI by 2030
- **The dollar** lost reserve dominance below 57%

Everyone reads the news. **Nobody knows what it means for them personally.**

Domino bridges that gap.

## Quick Start

```bash
git clone https://github.com/aykutturksoy5-maker/domino.git
cd domino
pip install -e .

# See the cascade tree
domino simulate scenarios/hormuz_strait.json

# See YOUR personal impact
domino simulate scenarios/hormuz_strait.json \
  --profile '{"monthly_fuel_spend": 3000, "monthly_energy_bill": 2500, "monthly_groceries": 8000, "savings": 150000}'
```

### Web Dashboard

> **Try it now:** [domino-crisis.vercel.app](https://domino-crisis.vercel.app)

Or run locally:

```bash
cd web && npm install && npm run dev
# Open http://localhost:3000
```

## What You See

```
>> Strait of Hormuz blocked  (Reuters, IEA March 2026)
├── → Global oil supply drops 8M barrels/day  -8%
│   ├── → Brent crude surges to $119/barrel  +40%  (+3d)
│   │   ├── → Commercial transport costs surge  +25%  (+14d)
│   │   └── → Manufacturing costs rise, PMIs decline  +5%  (+30d)
│   └── → Retail fuel prices spike  +35%  (+7d)
│       └── → Your monthly fuel cost increases  +35%  (+7d)  → TRY +1,050/mo
├── → LNG prices surge 66%  (+7d)
│   └── → Electricity bills increase  +30%  (+45d)  → TRY +750/mo
└── → Fertilizer supply drops 30%  (+14d)
    ├── → Wheat prices surge  +22%  (+60d)
    │   └── → Bread, pasta, flour rise  +18%  (+90d)
    └── → Crop yields decline  -15%  (+120d)
        └── → Food prices rise 15%  (+120d)  → TRY +1,200/mo

─── TOTAL PERSONAL IMPACT ───
Monthly:  TRY +3,000
Annual:   TRY +36,000
Savings:  50 months → 41.7 months
```

## Built-in Scenarios

| Scenario | Trigger | Nodes | Sectors |
|----------|---------|-------|---------|
| **Hormuz Strait Blockade** | Iran-Israel war blocks 20% of global oil | 15 | Energy, Food, Transport |
| **Dollar Reserve Collapse** | USD drops below 50% global reserves | 12 | Currency, Finance, Food |
| **AI Employment Wave** | Agentic AI automates 40% of knowledge work | 13 | Employment, Technology, Health |
| **Pandemic v2 (H5N1)** | Novel avian flu achieves human transmission | 11 | Health, Supply Chain, Finance |
| **Taiwan Semiconductor Crisis** | Strait blockade cuts 60% of global foundry capacity | 11 | Technology, Transport, Employment |
| **Climate Crop Failure** | Synchronized droughts & floods across breadbaskets | 10 | Food, Agriculture, Security |
| **Marmara Earthquake** | M7.5+ quake hits Istanbul metropolitan area | 10 | Housing, Insurance, Currency |
| **Crypto Crash Contagion** | 80%+ drawdown with stablecoin depegs | 11 | Finance, Employment, Credit |
| **Energy Transition** | Peak oil demand triggers structural price decline | 11 | Energy, Employment, Currency |

## How It Works

Domino models cascading impacts as a **directed acyclic graph (DAG)**:

1. **Trigger Event** → Something happens (war, policy change, natural disaster)
2. **Cascade Chain** → Ripples through sectors: energy → transport → food → employment
3. **Personal Translation** → Each ripple hits YOUR finances using your profile
4. **Time Modeling** → Each domino has a delay (days) and duration

Every node carries:
- **Magnitude** — quantified impact (e.g., +40%)
- **Delay** — when this domino falls after its parent
- **Confidence** — how certain this link is (0-1)
- **Source** — real data citation

## Build Your Own Scenario

```python
from cascade.core import CascadeEngine, CascadeNode, CascadeChain
from cascade.core.node import Sector, ImpactDirection

engine = CascadeEngine()
chain = engine.create_chain()

chain.add_node(CascadeNode(
    id="earthquake",
    event="Major earthquake hits Istanbul",
    sector=Sector.SECURITY,
    magnitude=7.2, unit="richter",
    direction=ImpactDirection.DISRUPTED,
))

chain.add_node(CascadeNode(
    id="housing",
    event="30% of housing stock damaged",
    sector=Sector.HOUSING,
    magnitude=30, direction=ImpactDirection.DOWN,
    delay_days=0,
))

chain.connect("earthquake", "housing")

summary = engine.summary(profile={"monthly_rent": 15000, "savings": 200000})
print(f"Monthly impact: TRY {summary.total_monthly_impact:+,.0f}")
```

## AI-Powered Cascade Generation

With Ollama running locally (free), Domino can generate cascade chains from any event description:

```bash
# Start Ollama
ollama serve
ollama pull qwen2.5:7b

# Start API
uvicorn cascade.api.app:app

# Generate cascade from any event
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"event": "Taiwan semiconductor blockade cuts global chip supply by 60%"}'
```

## Architecture

```
cascade/
├── core/           # Engine, chain DAG, scenarios, personal impact
├── data/           # Real-time data providers
│   └── providers/  # NewsMCP, GDELT, Yahoo Finance, World Bank
├── agents/         # AI agent layer (Ollama / OpenAI-compatible)
├── api/            # FastAPI REST endpoints
web/                # Next.js dashboard with cascade visualization
scenarios/          # Pre-built crisis scenarios (JSON)
tests/              # Pytest test suite
```

## Data Sources (all free)

| Source | Data | Key Required |
|--------|------|-------------|
| NewsMCP | Real-time global news, AI-clustered | No |
| GDELT | Global events, 150+ countries | No |
| Yahoo Finance | Oil, gold, gas, wheat, currencies | No |
| World Bank | GDP, inflation, unemployment | No |
| TCMB | Turkish Central Bank data | No |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Engine | Python 3.11+ / Pydantic |
| API | FastAPI |
| AI | Ollama (local) or any OpenAI-compatible |
| Frontend | Next.js / Tailwind CSS |
| Data | Free APIs (NewsMCP, GDELT, Yahoo, World Bank) |

## Roadmap

- [x] Core cascade engine with DAG modeling
- [x] CLI with rich terminal output
- [x] Web dashboard with interactive visualization
- [x] 9 built-in scenarios (Hormuz, Dollar, AI, Pandemic, Taiwan, Climate, Earthquake, Crypto, Energy)
- [x] Real-time data providers
- [x] AI-powered cascade generation
- [x] Personal impact calculator
- [ ] Compound scenario mode (stack multiple crises)
- [ ] Historical accuracy tracking
- [ ] Community scenario marketplace
- [ ] Mobile app
- [ ] MCP server for AI agent integration

## Contributing

We welcome contributions:
- **New scenarios** — Model crises in your region
- **Data providers** — Integrate more real-time sources
- **Visualization** — Improve cascade rendering
- **AI models** — Better prediction algorithms
- **Translations** — Make Domino accessible globally

See **[CONTRIBUTING.md](docs/contributing.md)** for details.

## License

MIT — Use it, fork it, build on it.

---

<div align="center">

*Built during the compound crisis of 2026.*
*Because everyone deserves a compass in the storm.*

</div>
