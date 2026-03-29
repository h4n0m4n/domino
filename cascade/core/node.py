"""
CascadeNode — A single domino in the chain.

Each node represents one step in a cascading impact:
  "Hormuz Strait blocked" → "Oil supply -8%" → "Fuel price +40%" → ...

Nodes carry:
  - What happened (event description)
  - Quantified impact (magnitude, unit, direction)
  - Time delay (how long until this domino falls)
  - Confidence level (how certain is this link)
  - Sector tags (energy, food, employment, currency, etc.)
"""

from __future__ import annotations

from datetime import timedelta
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class Sector(str, Enum):
    ENERGY = "energy"
    FOOD = "food"
    CURRENCY = "currency"
    EMPLOYMENT = "employment"
    HOUSING = "housing"
    FINANCE = "finance"
    HEALTH = "health"
    TRANSPORT = "transport"
    TECHNOLOGY = "technology"
    SECURITY = "security"


class ImpactDirection(str, Enum):
    UP = "up"
    DOWN = "down"
    DISRUPTED = "disrupted"
    BLOCKED = "blocked"
    COLLAPSED = "collapsed"


class CascadeNode(BaseModel):
    """A single domino piece in the cascade chain."""

    id: str = Field(description="Unique node identifier")
    event: str = Field(description="What happens at this step")
    detail: str = Field(default="", description="Longer explanation")

    sector: Sector = Field(description="Which sector this affects")
    region: str = Field(default="global", description="Geographic scope")

    magnitude: float = Field(default=0.0, description="Size of impact (e.g. 40 for +40%)")
    unit: str = Field(default="%", description="Unit of magnitude")
    direction: ImpactDirection = Field(default=ImpactDirection.UP)

    delay_days: int = Field(
        default=0,
        description="Days after parent event until this domino falls",
    )
    duration_days: int = Field(
        default=90,
        description="How long this effect persists",
    )

    confidence: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="How certain is this cascade link (0-1)",
    )

    source: str = Field(default="", description="Data source or reasoning")
    children: list[str] = Field(default_factory=list, description="IDs of downstream nodes")
    metadata: dict[str, Any] = Field(default_factory=dict)

    @property
    def delay(self) -> timedelta:
        return timedelta(days=self.delay_days)

    @property
    def severity(self) -> str:
        """Human-readable severity based on magnitude."""
        m = abs(self.magnitude)
        if m >= 50:
            return "critical"
        if m >= 20:
            return "severe"
        if m >= 10:
            return "significant"
        if m >= 5:
            return "moderate"
        return "minor"

    def impact_label(self) -> str:
        """Human-readable impact: '+40% oil price' or '-8M barrels/day'."""
        sign = "+" if self.direction in (ImpactDirection.UP,) else "-"
        if self.direction in (ImpactDirection.DISRUPTED, ImpactDirection.BLOCKED, ImpactDirection.COLLAPSED):
            return f"{self.direction.value}: {self.event}"
        return f"{sign}{self.magnitude}{self.unit}"
