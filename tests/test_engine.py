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


def test_empty_profile():
    path = SCENARIOS_DIR / "hormuz_strait.json"
    if not path.exists():
        return
    engine = CascadeEngine()
    engine.load_scenario(path)
    summary = engine.summary(profile={})
    assert summary.total_monthly_impact == 0
    assert summary.savings_runway_months is None


def test_negative_values_sanitized():
    path = SCENARIOS_DIR / "hormuz_strait.json"
    if not path.exists():
        return
    engine = CascadeEngine()
    engine.load_scenario(path)
    summary = engine.summary(profile={"monthly_groceries": -500, "savings": -100})
    assert summary.total_monthly_impact == 0


def test_string_values_in_profile():
    path = SCENARIOS_DIR / "hormuz_strait.json"
    if not path.exists():
        return
    engine = CascadeEngine()
    engine.load_scenario(path)
    summary = engine.summary(profile={"monthly_groceries": "not_a_number", "savings": "abc"})
    assert summary.total_monthly_impact == 0


def test_all_scenarios_have_nodes():
    for json_file in SCENARIOS_DIR.glob("*.json"):
        engine = CascadeEngine()
        scenario = engine.load_scenario(json_file)
        assert scenario.chain.size > 0, f"{json_file.name} has no nodes"
        assert scenario.chain.total_depth() > 0, f"{json_file.name} has no depth"


def test_no_orphan_children():
    """All child IDs referenced in nodes must exist in the chain."""
    for json_file in SCENARIOS_DIR.glob("*.json"):
        engine = CascadeEngine()
        scenario = engine.load_scenario(json_file)
        all_ids = set(scenario.chain.nodes.keys())
        for node in scenario.chain.nodes.values():
            for child_id in node.children:
                assert child_id in all_ids, f"{json_file.name}: node '{node.id}' references missing child '{child_id}'"


def test_personal_impact_no_double_count():
    """Personal nodes should not double-count with intermediate nodes."""
    path = SCENARIOS_DIR / "hormuz_strait.json"
    if not path.exists():
        return
    engine = CascadeEngine()
    engine.load_scenario(path)

    profile = {"monthly_fuel_spend": 1000, "monthly_energy_bill": 1000, "monthly_groceries": 1000}
    impacts = engine.compute_personal_impact(profile=profile)

    personal_costs = [i for i in impacts if i.monthly_cost_change != 0]
    personal_ids = [i.node_id for i in personal_costs]

    for i in personal_costs:
        node = engine.active_chain.nodes.get(i.node_id)
        if node:
            for child_id in node.children:
                assert child_id not in personal_ids, f"Both '{i.node_id}' and child '{child_id}' have costs — double counting"
