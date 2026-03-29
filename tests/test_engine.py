"""Tests for the core cascade engine."""

from pathlib import Path

from cascade.core.engine import CascadeEngine
from cascade.core.node import CascadeNode, ImpactDirection, Sector
from cascade.core.chain import CascadeChain
from cascade.core.scenario import Scenario


SCENARIOS_DIR = Path(__file__).parent.parent / "scenarios"


def test_node_creation():
    node = CascadeNode(
        id="test",
        event="Test event",
        sector=Sector.ENERGY,
        magnitude=40,
        direction=ImpactDirection.UP,
    )
    assert node.id == "test"
    assert node.severity == "severe"
    assert "+40.0%" in node.impact_label()


def test_chain_building():
    chain = CascadeChain()
    chain.add_node(CascadeNode(id="root", event="Root", sector=Sector.SECURITY, magnitude=90, direction=ImpactDirection.BLOCKED))
    chain.add_node(CascadeNode(id="child1", event="Child 1", sector=Sector.ENERGY, magnitude=40, direction=ImpactDirection.UP, delay_days=3))
    chain.add_node(CascadeNode(id="child2", event="Child 2", sector=Sector.FOOD, magnitude=20, direction=ImpactDirection.UP, delay_days=14))
    chain.connect("root", "child1")
    chain.connect("root", "child2")

    assert chain.size == 3
    assert chain.total_depth() == 2
    assert len(chain.get_children("root")) == 2
    assert len(chain.get_full_cascade()) == 3


def test_load_hormuz_scenario():
    path = SCENARIOS_DIR / "hormuz_strait.json"
    if not path.exists():
        return
    engine = CascadeEngine()
    scenario = engine.load_scenario(path)
    assert scenario.name == "Hormuz Strait Blockade"
    assert engine.active_chain is not None
    assert engine.active_chain.size >= 10


def test_personal_impact():
    path = SCENARIOS_DIR / "hormuz_strait.json"
    if not path.exists():
        return
    engine = CascadeEngine()
    engine.load_scenario(path)

    profile = {
        "monthly_fuel_spend": 3000,
        "monthly_energy_bill": 2500,
        "monthly_groceries": 8000,
        "savings": 150000,
    }

    summary = engine.summary(profile=profile)
    assert summary.total_monthly_impact > 0
    assert summary.total_annual_impact > 0
    assert summary.savings_runway_months is not None
    assert summary.savings_runway_months > 0


def test_load_all_scenarios():
    engine = CascadeEngine()
    loaded = engine.load_scenarios_dir(SCENARIOS_DIR)
    assert len(loaded) >= 3


def test_chain_serialization():
    chain = CascadeChain()
    chain.add_node(CascadeNode(id="a", event="A", sector=Sector.ENERGY, magnitude=10, direction=ImpactDirection.UP))
    data = chain.to_dict()
    assert "nodes" in data
    assert data["node_count"] == 1
