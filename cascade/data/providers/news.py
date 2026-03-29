"""
News data provider — NewsMCP + GDELT integration.
Both are free, no API key required.
"""

from __future__ import annotations

from datetime import datetime, timezone

import httpx

from cascade.data.providers.base import BaseProvider, DataPoint

NEWSMCP_BASE = "https://newsmcp.io/v1"
GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc"


class NewsMCPProvider(BaseProvider):
    """Fetches real-time clustered news from NewsMCP (free, no key)."""

    name = "newsmcp"

    def __init__(self):
        self._client = httpx.AsyncClient(timeout=15)

    async def fetch(self, topic: str = "economy", region: str = "") -> list[DataPoint]:
        params: dict = {"topic": topic}
        if region:
            params["region"] = region

        try:
            resp = await self._client.get(f"{NEWSMCP_BASE}/events", params=params)
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return []

        points: list[DataPoint] = []
        for event in data if isinstance(data, list) else data.get("events", []):
            points.append(DataPoint(
                source="newsmcp",
                category="news",
                key=event.get("title", "Unknown"),
                value=event.get("relevance", 0),
                unit="relevance",
                timestamp=datetime.now(timezone.utc),
                metadata={
                    "topic": event.get("topic", ""),
                    "region": event.get("region", ""),
                    "url": event.get("url", ""),
                    "sources": event.get("sources", []),
                },
            ))
        return points

    async def health_check(self) -> bool:
        try:
            resp = await self._client.get(f"{NEWSMCP_BASE}/events", params={"topic": "economy"})
            return resp.status_code == 200
        except Exception:
            return False


class GDELTProvider(BaseProvider):
    """Fetches global event data from GDELT (free, no key)."""

    name = "gdelt"

    def __init__(self):
        self._client = httpx.AsyncClient(timeout=15)

    async def fetch(self, query: str = "oil crisis", mode: str = "ArtList") -> list[DataPoint]:
        params = {
            "query": query,
            "mode": mode,
            "maxrecords": "20",
            "format": "json",
            "sort": "DateDesc",
        }

        try:
            resp = await self._client.get(GDELT_DOC_API, params=params)
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return []

        points: list[DataPoint] = []
        articles = data.get("articles", [])
        for art in articles:
            points.append(DataPoint(
                source="gdelt",
                category="news",
                key=art.get("title", "Unknown"),
                value=art.get("tone", 0),
                unit="tone",
                timestamp=datetime.now(timezone.utc),
                metadata={
                    "url": art.get("url", ""),
                    "domain": art.get("domain", ""),
                    "language": art.get("language", ""),
                    "seendate": art.get("seendate", ""),
                },
            ))
        return points

    async def health_check(self) -> bool:
        try:
            resp = await self._client.get(
                GDELT_DOC_API,
                params={"query": "test", "mode": "ArtList", "maxrecords": "1", "format": "json"},
            )
            return resp.status_code == 200
        except Exception:
            return False
