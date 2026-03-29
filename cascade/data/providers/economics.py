"""
Economic data provider — World Bank + FRED (free, key optional).
Inflation, GDP, employment, interest rates.
"""

from __future__ import annotations

from datetime import datetime, timezone

import httpx

from cascade.data.providers.base import BaseProvider, DataPoint

WORLD_BANK_BASE = "https://api.worldbank.org/v2"


class WorldBankProvider(BaseProvider):
    """Fetches macroeconomic indicators from World Bank (free, no key)."""

    name = "world_bank"

    INDICATORS = {
        "FP.CPI.TOTL.ZG": ("Inflation Rate", "inflation", "%"),
        "NY.GDP.MKTP.KD.ZG": ("GDP Growth", "gdp", "%"),
        "SL.UEM.TOTL.ZS": ("Unemployment Rate", "employment", "%"),
        "FR.INR.RINR": ("Real Interest Rate", "finance", "%"),
    }

    def __init__(self):
        self._client = httpx.AsyncClient(timeout=15)

    async def fetch(self, country: str = "TUR", years: int = 3) -> list[DataPoint]:
        points: list[DataPoint] = []

        for indicator_id, (name, category, unit) in self.INDICATORS.items():
            try:
                resp = await self._client.get(
                    f"{WORLD_BANK_BASE}/country/{country}/indicator/{indicator_id}",
                    params={"format": "json", "per_page": str(years), "mrv": str(years)},
                )
                resp.raise_for_status()
                data = resp.json()

                if len(data) < 2:
                    continue

                for entry in data[1] or []:
                    val = entry.get("value")
                    if val is None:
                        continue
                    points.append(DataPoint(
                        source="world_bank",
                        category=category,
                        key=f"{name} ({entry.get('country', {}).get('value', country)})",
                        value=float(val),
                        unit=unit,
                        timestamp=datetime(int(entry.get("date", "2024")), 1, 1, tzinfo=timezone.utc),
                        metadata={
                            "country_code": country,
                            "indicator_id": indicator_id,
                            "year": entry.get("date"),
                        },
                    ))
            except Exception:
                continue

        return points

    async def health_check(self) -> bool:
        try:
            resp = await self._client.get(
                f"{WORLD_BANK_BASE}/country/TUR/indicator/FP.CPI.TOTL.ZG",
                params={"format": "json", "per_page": "1", "mrv": "1"},
            )
            return resp.status_code == 200
        except Exception:
            return False
