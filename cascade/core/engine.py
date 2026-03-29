"""
CascadeEngine — The brain of Domino.

Takes a trigger event, builds the cascade chain, and calculates
downstream impacts through the entire domino sequence.

The engine can work in two modes:
  1. Static: Load a predefined scenario and compute impacts
  2. Live: Connect to real-time data feeds and compute dynamic cascades
"""

from __future__ import annotations

from pathlib import Path

from cascade.core.chain import CascadeChain
from cascade.core.node import CascadeNode, ImpactDirection, Sector
from cascade.core.scenario import Scenario


class CascadeEngine:
    """Main engine that drives cascade simulations."""

    def __init__(self):
        self._scenarios: dict[str, Scenario] = {}
        self._active_chain: CascadeChain | None = None

    def load_scenario(self, path: str | Path) -> Scenario:
        """Load a scenario from a JSON file."""
        scenario = Scenario.load(path)
        self._scenarios[scenario.name] = scenario
        self._active_chain = scenario.chain
        return scenario

    def load_scenarios_dir(self, directory: str | Path) -> list[Scenario]:
        """Load all scenarios from a directory."""
        directory = Path(directory)
        loaded = []
        for json_file in sorted(directory.glob("*.json")):
            scenario = self.load_scenario(json_file)
            loaded.append(scenario)
        return loaded

    @property
    def active_chain(self) -> CascadeChain | None:
        return self._active_chain

    def create_chain(self) -> CascadeChain:
        """Create a new empty chain and set it as active."""
        chain = CascadeChain()
        self._active_chain = chain
        return chain

    def compute_personal_impact(
        self,
        chain: CascadeChain | None = None,
        profile: dict | None = None,
    ) -> list[PersonalImpact]:
        """
        Translate cascade nodes into personal financial impact.

        profile keys:
            - monthly_fuel_spend: float (TRY)
            - monthly_energy_bill: float (TRY)
            - monthly_groceries: float (TRY)
            - monthly_rent: float (TRY)
            - monthly_income: float (TRY)
            - savings: float (TRY)
            - profession: str
            - city: str
            - family_size: int
        """
        chain = chain or self._active_chain
        if not chain:
            return []

        profile = profile or {}
        impacts: list[PersonalImpact] = []

        for node in chain.get_full_cascade():
            impact = self._translate_node_to_personal(node, profile)
            if impact:
                impacts.append(impact)

        return impacts

    def _translate_node_to_personal(
        self,
        node: CascadeNode,
        profile: dict,
    ) -> PersonalImpact | None:
        """Translate a single cascade node into personal financial terms.

        Only nodes with region="personal" or leaf nodes (no children in same
        budget sector) produce monetary impact. This prevents double-counting
        when intermediate nodes feed into a final personal node.
        """

        sector_to_budget = {
            Sector.ENERGY: ("monthly_energy_bill", "Energy bill"),
            Sector.TRANSPORT: ("monthly_fuel_spend", "Fuel cost"),
            Sector.FOOD: ("monthly_groceries", "Grocery bill"),
            Sector.HOUSING: ("monthly_rent", "Rent"),
        }

        mapping = sector_to_budget.get(node.sector)
        is_personal = node.region == "personal"

        if not mapping:
            return PersonalImpact(
                node_id=node.id,
                event=node.event,
                sector=node.sector,
                monthly_cost_change=0,
                description=f"{node.impact_label()} — {node.event}",
                delay_days=node.delay_days,
            )

        budget_key, label = mapping
        current_spend = profile.get(budget_key, 0)
        if current_spend <= 0:
            return None

        has_personal_child = self._has_personal_descendant(node)

        if not is_personal and has_personal_child:
            return PersonalImpact(
                node_id=node.id,
                event=node.event,
                sector=node.sector,
                monthly_cost_change=0,
                description=f"{label}: {node.impact_label()} (cascades further)",
                delay_days=node.delay_days,
            )

        pct_change = node.magnitude / 100.0
        if node.direction == ImpactDirection.DOWN:
            pct_change = -pct_change

        monthly_change = current_spend * pct_change

        return PersonalImpact(
            node_id=node.id,
            event=node.event,
            sector=node.sector,
            monthly_cost_change=round(monthly_change, 2),
            description=f"{label}: {node.impact_label()} → ₺{monthly_change:+,.0f}/month",
            delay_days=node.delay_days,
        )

    def _has_personal_descendant(self, node: CascadeNode) -> bool:
        """Check if any descendant of this node has region='personal'."""
        chain = self._active_chain
        if not chain:
            return False
        for child_id in node.children:
            child = chain.nodes.get(child_id)
            if child and (child.region == "personal" or self._has_personal_descendant(child)):
                return True
        return False

    def summary(self, profile: dict | None = None) -> CascadeSummary:
        """Generate a full summary of the active cascade's personal impact."""
        chain = self._active_chain
        if not chain:
            return CascadeSummary.empty()

        impacts = self.compute_personal_impact(profile=profile)
        total_monthly = sum(i.monthly_cost_change for i in impacts)
        total_annual = total_monthly * 12

        savings = (profile or {}).get("savings", 0)
        months_until_depleted = (
            round(savings / total_monthly, 1) if total_monthly > 0 and savings > 0 else None
        )

        return CascadeSummary(
            scenario_name=list(self._scenarios.keys())[-1] if self._scenarios else "custom",
            total_nodes=chain.size,
            max_depth=chain.total_depth(),
            sectors_affected=list({n.sector for n in chain.get_full_cascade()}),
            personal_impacts=impacts,
            total_monthly_impact=round(total_monthly, 2),
            total_annual_impact=round(total_annual, 2),
            savings_runway_months=months_until_depleted,
        )


class PersonalImpact:
    """Personal financial impact of a single cascade node."""

    def __init__(
        self,
        node_id: str,
        event: str,
        sector: Sector,
        monthly_cost_change: float,
        description: str,
        delay_days: int = 0,
    ):
        self.node_id = node_id
        self.event = event
        self.sector = sector
        self.monthly_cost_change = monthly_cost_change
        self.description = description
        self.delay_days = delay_days

    def to_dict(self) -> dict:
        return {
            "node_id": self.node_id,
            "event": self.event,
            "sector": self.sector.value,
            "monthly_cost_change": self.monthly_cost_change,
            "description": self.description,
            "delay_days": self.delay_days,
        }


class CascadeSummary:
    """Full summary of a cascade simulation with personal impact."""

    def __init__(
        self,
        scenario_name: str,
        total_nodes: int,
        max_depth: int,
        sectors_affected: list[Sector],
        personal_impacts: list[PersonalImpact],
        total_monthly_impact: float,
        total_annual_impact: float,
        savings_runway_months: float | None,
    ):
        self.scenario_name = scenario_name
        self.total_nodes = total_nodes
        self.max_depth = max_depth
        self.sectors_affected = sectors_affected
        self.personal_impacts = personal_impacts
        self.total_monthly_impact = total_monthly_impact
        self.total_annual_impact = total_annual_impact
        self.savings_runway_months = savings_runway_months

    @classmethod
    def empty(cls) -> CascadeSummary:
        return cls(
            scenario_name="none",
            total_nodes=0,
            max_depth=0,
            sectors_affected=[],
            personal_impacts=[],
            total_monthly_impact=0,
            total_annual_impact=0,
            savings_runway_months=None,
        )

    def to_dict(self) -> dict:
        return {
            "scenario": self.scenario_name,
            "cascade": {
                "total_nodes": self.total_nodes,
                "max_depth": self.max_depth,
                "sectors_affected": [s.value for s in self.sectors_affected],
            },
            "personal_impact": {
                "monthly": f"₺{self.total_monthly_impact:+,.0f}",
                "annual": f"₺{self.total_annual_impact:+,.0f}",
                "savings_runway_months": self.savings_runway_months,
                "breakdown": [i.to_dict() for i in self.personal_impacts],
            },
        }
