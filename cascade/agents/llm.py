"""
LLM Agent — Connects to Ollama (local, free) or any OpenAI-compatible API.

Used for:
  - Generating cascade chains from free-text event descriptions
  - Analyzing impact severity and confidence
  - Generating personal action recommendations
"""

from __future__ import annotations

import json
import os
from typing import Any

import httpx

from cascade.agents.base import BaseAgent

SYSTEM_PROMPT = """You are Domino, a cascading impact analysis engine. 
Your job is to analyze global events and model how they cascade through economic sectors into personal financial impact.

When given an event, you must:
1. Identify the primary sectors affected (energy, food, currency, employment, housing, transport, finance, health, technology, security)
2. Model the cascade chain - each step must have: event description, sector, magnitude (%), direction (up/down/disrupted), delay in days, confidence (0-1), and data source
3. Be specific and quantitative. Use real data and historical precedents.
4. Always end chains with personal impact nodes showing how it affects an individual's finances.

Output your analysis as JSON matching this structure:
{
  "trigger": "event description",
  "nodes": [
    {
      "id": "unique_id",
      "event": "What happens",
      "detail": "Longer explanation with data",
      "sector": "energy|food|currency|employment|housing|transport|finance|health|technology|security",
      "magnitude": 40,
      "unit": "%",
      "direction": "up|down|disrupted|blocked",
      "delay_days": 7,
      "confidence": 0.85,
      "source": "Data source",
      "children": ["child_id_1", "child_id_2"]
    }
  ]
}"""


class LLMAgent(BaseAgent):
    """LLM-powered cascade analysis agent."""

    name = "llm_cascade"

    def __init__(
        self,
        provider: str = "ollama",
        model: str = "qwen2.5:7b",
        base_url: str = "http://localhost:11434",
    ):
        self.provider = provider or os.getenv("LLM_PROVIDER", "ollama")
        self.model = model or os.getenv("LLM_MODEL", "qwen2.5:7b")
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self._client = httpx.AsyncClient(timeout=120)

    async def analyze(self, prompt: str, context: dict[str, Any] | None = None) -> str:
        """Send analysis request to LLM."""
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]

        if self.provider == "ollama":
            return await self._call_ollama(messages)
        else:
            return await self._call_openai_compatible(messages)

    async def generate_cascade(self, event_description: str) -> dict:
        """Generate a complete cascade chain from an event description."""
        prompt = f"""Analyze this event and generate a complete cascade chain:

EVENT: {event_description}

Generate a cascade chain showing how this event ripples through the economy to affect individual people.
Include at least 8-12 nodes. End with personal impact nodes.
Be specific with numbers, cite real data sources where possible.
Output valid JSON only."""

        response = await self.analyze(prompt)

        try:
            start = response.find("{")
            end = response.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass

        return {"error": "Failed to parse LLM response", "raw": response}

    async def generate_recommendations(self, profile: dict, impacts: list[dict]) -> list[str]:
        """Generate personalized action recommendations."""
        prompt = f"""Based on this person's profile and the crisis impacts they face, 
suggest 5 specific, actionable steps they should take THIS WEEK.

PROFILE:
{json.dumps(profile, indent=2)}

IMPACTS THEY FACE:
{json.dumps(impacts, indent=2)}

Be specific and practical. Not generic advice. Consider their city, profession, and financial situation.
Output as a JSON array of strings."""

        response = await self.analyze(prompt)

        try:
            start = response.find("[")
            end = response.rfind("]") + 1
            if start >= 0 and end > start:
                return json.loads(response[start:end])
        except json.JSONDecodeError:
            pass

        return ["Unable to generate recommendations. Check LLM connection."]

    async def _call_ollama(self, messages: list[dict]) -> str:
        """Call Ollama API."""
        resp = await self._client.post(
            f"{self.base_url}/api/chat",
            json={"model": self.model, "messages": messages, "stream": False},
        )
        resp.raise_for_status()
        return resp.json().get("message", {}).get("content", "")

    async def _call_openai_compatible(self, messages: list[dict]) -> str:
        """Call OpenAI-compatible API (works with OpenAI, Groq, Together, etc.)."""
        api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
        base = self.base_url.rstrip("/")

        resp = await self._client.post(
            f"{base}/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={"model": self.model, "messages": messages, "temperature": 0.3},
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

    async def health_check(self) -> bool:
        """Check if LLM is reachable."""
        try:
            if self.provider == "ollama":
                resp = await self._client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
            return True
        except Exception:
            return False
