"""
Base AI Agent — Interface for LLM-powered cascade reasoning.

Agents analyze real-world events and generate cascade chains,
predict impacts, and recommend actions.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BaseAgent(ABC):
    """Base class for AI-powered cascade agents."""

    name: str = "base"

    @abstractmethod
    async def analyze(self, prompt: str, context: dict[str, Any] | None = None) -> str:
        """Send a prompt to the LLM and get a response."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the LLM is reachable."""
        ...
