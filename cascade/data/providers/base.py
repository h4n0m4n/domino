"""Base interface for all data providers."""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class DataPoint(BaseModel):
    """A single data point from any provider."""
    source: str
    category: str
    key: str
    value: float
    unit: str
    timestamp: datetime
    metadata: dict[str, Any] = Field(default_factory=dict)


class BaseProvider(ABC):
    """Base class for data providers."""

    name: str = "base"

    @abstractmethod
    async def fetch(self) -> list[DataPoint]:
        """Fetch latest data from this provider."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the provider is reachable."""
        ...
