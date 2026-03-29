"""FastAPI backend serving cascade simulation data to the frontend."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from cascade.core.engine import CascadeEngine

app = FastAPI(title="Domino API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SCENARIOS_DIR = Path(__file__).parent.parent.parent / "scenarios"
engine = CascadeEngine()


class ProfileInput(BaseModel):
    monthly_fuel_spend: float = 0
    monthly_energy_bill: float = 0
    monthly_groceries: float = 0
    monthly_rent: float = 0
    monthly_income: float = 0
    savings: float = 0
    profession: str = ""
    city: str = ""
    family_size: int = 1


class SimulateRequest(BaseModel):
    scenario: str = "hormuz_strait"
    profile: ProfileInput = ProfileInput()


@app.get("/api/scenarios")
def list_scenarios():
    """List all available scenarios."""
    scenarios = []
    for f in sorted(SCENARIOS_DIR.glob("*.json")):
        from cascade.core.scenario import Scenario
        s = Scenario.load(f)
        scenarios.append({
            "id": f.stem,
            "name": s.name,
            "description": s.description,
            "trigger_event": s.trigger_event,
            "date": s.date,
            "tags": s.tags,
        })
    return scenarios


@app.get("/api/scenarios/{scenario_id}")
def get_scenario(scenario_id: str):
    """Get full cascade chain for a scenario."""
    path = SCENARIOS_DIR / f"{scenario_id}.json"
    if not path.exists():
        return {"error": "Scenario not found"}

    eng = CascadeEngine()
    scenario = eng.load_scenario(path)
    chain = eng.active_chain

    nodes = []
    edges = []
    for node in chain.get_full_cascade():
        nodes.append(node.model_dump())
        for child_id in node.children:
            edges.append({"source": node.id, "target": child_id})

    return {
        "scenario": {
            "name": scenario.name,
            "description": scenario.description,
            "trigger_event": scenario.trigger_event,
            "date": scenario.date,
            "tags": scenario.tags,
        },
        "chain": {
            "nodes": nodes,
            "edges": edges,
            "stats": {
                "total_nodes": chain.size,
                "max_depth": chain.total_depth(),
                "sectors": list({n.sector.value for n in chain.get_full_cascade()}),
            },
        },
    }


@app.post("/api/simulate")
def simulate(req: SimulateRequest):
    """Run cascade simulation with personal profile."""
    path = SCENARIOS_DIR / f"{req.scenario}.json"
    if not path.exists():
        return {"error": "Scenario not found"}

    eng = CascadeEngine()
    eng.load_scenario(path)

    profile = req.profile.model_dump()
    summary = eng.summary(profile=profile)

    chain = eng.active_chain
    nodes = []
    edges = []
    for node in chain.get_full_cascade():
        nodes.append(node.model_dump())
        for child_id in node.children:
            edges.append({"source": node.id, "target": child_id})

    return {
        "chain": {"nodes": nodes, "edges": edges},
        "summary": summary.to_dict(),
    }


class GenerateRequest(BaseModel):
    event: str
    profile: ProfileInput = ProfileInput()


@app.post("/api/generate")
async def generate_cascade(req: GenerateRequest):
    """Use AI to generate a cascade chain from a free-text event description."""
    from cascade.agents.llm import LLMAgent
    agent = LLMAgent()

    try:
        result = await agent.generate_cascade(req.event)
        return result
    except Exception as e:
        return {"error": str(e), "hint": "Make sure Ollama is running: ollama serve"}


@app.post("/api/recommend")
async def get_recommendations(req: SimulateRequest):
    """Get AI-powered personal action recommendations."""
    from cascade.agents.llm import LLMAgent
    agent = LLMAgent()

    path = SCENARIOS_DIR / f"{req.scenario}.json"
    if not path.exists():
        return {"error": "Scenario not found"}

    eng = CascadeEngine()
    eng.load_scenario(path)
    profile = req.profile.model_dump()
    summary = eng.summary(profile=profile)

    impacts = [i.to_dict() for i in summary.personal_impacts if i.monthly_cost_change != 0]

    try:
        recs = await agent.generate_recommendations(profile, impacts)
        return {"recommendations": recs}
    except Exception as e:
        return {"error": str(e), "hint": "Make sure Ollama is running: ollama serve"}


@app.get("/api/data/health")
async def data_health():
    """Check health of all data providers."""
    from cascade.data.aggregator import DataAggregator
    agg = DataAggregator()
    return await agg.health()


@app.get("/api/data/commodities")
async def get_commodities():
    """Get real-time commodity prices."""
    from cascade.data.providers.commodities import CommodityProvider
    provider = CommodityProvider()
    points = await provider.fetch()
    return [p.model_dump() for p in points]


@app.get("/api/data/news")
async def get_news(topic: str = "economy", region: str = ""):
    """Get latest news from NewsMCP."""
    from cascade.data.providers.news import NewsMCPProvider
    provider = NewsMCPProvider()
    points = await provider.fetch(topic=topic, region=region)
    return [p.model_dump() for p in points]


def start():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    start()
