"""
Scenario — A predefined crisis template.

Scenarios are JSON files that define a cascade chain for a specific global event.
They can be loaded, modified, and personalized for individual users.
"""

from __future__ import annotations

import json
from pathlib import Path

from cascade.core.chain import CascadeChain
from cascade.core.node import CascadeNode


class Scenario:
    """A loadable crisis scenario that builds a CascadeChain."""

    def __init__(
        self,
        name: str,
        description: str,
        trigger_event: str,
        date: str = "",
        tags: list[str] | None = None,
    ):
        self.name = name
        self.description = description
        self.trigger_event = trigger_event
        self.date = date
        self.tags = tags or []
        self.chain = CascadeChain()

    def build_chain(self, nodes_data: list[dict], edges: list[tuple[str, str]]) -> CascadeChain:
        """Build a cascade chain from node definitions and edges."""
        for nd in nodes_data:
            self.chain.add_node(CascadeNode(**nd))
        for parent_id, child_id in edges:
            self.chain.connect(parent_id, child_id)
        return self.chain

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "description": self.description,
            "trigger_event": self.trigger_event,
            "date": self.date,
            "tags": self.tags,
            "chain": self.chain.to_dict(),
        }

    def save(self, path: str | Path) -> None:
        """Save scenario to JSON file."""
        path = Path(path)
        path.write_text(json.dumps(self.to_dict(), indent=2, ensure_ascii=False), encoding="utf-8")

    @classmethod
    def load(cls, path: str | Path) -> Scenario:
        """Load scenario from JSON file."""
        path = Path(path)
        data = json.loads(path.read_text(encoding="utf-8"))

        scenario = cls(
            name=data["name"],
            description=data["description"],
            trigger_event=data["trigger_event"],
            date=data.get("date", ""),
            tags=data.get("tags", []),
        )

        chain_data = data.get("chain", {})
        nodes_raw = chain_data.get("nodes", {})

        for node_data in nodes_raw.values():
            scenario.chain.add_node(CascadeNode(**node_data))

        # Edges are implicit in children field
        return scenario
