"""
Data Aggregator — Combines all providers into a single real-time data feed.
"""

from __future__ import annotations

import asyncio

from cascade.data.providers.base import BaseProvider, DataPoint
from cascade.data.providers.commodities import CommodityProvider
from cascade.data.providers.economics import WorldBankProvider
from cascade.data.providers.news import GDELTProvider, NewsMCPProvider


class DataAggregator:
    """Aggregates data from all providers."""

    def __init__(self):
        self.providers: list[BaseProvider] = [
            CommodityProvider(),
            NewsMCPProvider(),
            GDELTProvider(),
            WorldBankProvider(),
        ]

    async def fetch_all(self) -> dict[str, list[DataPoint]]:
        """Fetch data from all providers concurrently."""
        results: dict[str, list[DataPoint]] = {}

        async def _fetch_one(provider: BaseProvider) -> tuple[str, list[DataPoint]]:
            try:
                data = await provider.fetch()
                return provider.name, data
            except Exception:
                return provider.name, []

        tasks = [_fetch_one(p) for p in self.providers]
        completed = await asyncio.gather(*tasks)

        for name, data in completed:
            results[name] = data

        return results

    async def health(self) -> dict[str, bool]:
        """Check health of all providers."""
        results: dict[str, bool] = {}

        async def _check(provider: BaseProvider) -> tuple[str, bool]:
            ok = await provider.health_check()
            return provider.name, ok

        tasks = [_check(p) for p in self.providers]
        completed = await asyncio.gather(*tasks)

        for name, ok in completed:
            results[name] = ok

        return results
