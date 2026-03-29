"""
Commodity price provider — Yahoo Finance (free, no key).
Covers oil, gold, natural gas, wheat, corn, and more.
"""

from __future__ import annotations

from datetime import datetime, timezone

import httpx

from cascade.data.providers.base import BaseProvider, DataPoint

YAHOO_QUOTE_URL = "https://query1.finance.yahoo.com/v7/finance/quote"

COMMODITY_SYMBOLS = {
    "CL=F": ("Crude Oil WTI", "energy", "USD/barrel"),
    "BZ=F": ("Brent Crude", "energy", "USD/barrel"),
    "NG=F": ("Natural Gas", "energy", "USD/MMBtu"),
    "GC=F": ("Gold", "metals", "USD/oz"),
    "SI=F": ("Silver", "metals", "USD/oz"),
    "ZW=F": ("Wheat", "agriculture", "USD/bushel"),
    "ZC=F": ("Corn", "agriculture", "USD/bushel"),
    "ZS=F": ("Soybeans", "agriculture", "USD/bushel"),
}

CURRENCY_SYMBOLS = {
    "USDTRY=X": ("USD/TRY", "currency", "TRY"),
    "EURTRY=X": ("EUR/TRY", "currency", "TRY"),
    "DX-Y.NYB": ("US Dollar Index", "currency", "index"),
}


class CommodityProvider(BaseProvider):
    """Fetches real-time commodity prices from Yahoo Finance."""

    name = "yahoo_commodities"

    def __init__(self):
        self._client = httpx.AsyncClient(timeout=15, headers={
            "User-Agent": "Mozilla/5.0 (compatible; Domino/0.1)"
        })

    async def fetch(self, include_currencies: bool = True) -> list[DataPoint]:
        symbols = dict(COMMODITY_SYMBOLS)
        if include_currencies:
            symbols.update(CURRENCY_SYMBOLS)

        symbol_str = ",".join(symbols.keys())

        try:
            resp = await self._client.get(
                YAHOO_QUOTE_URL,
                params={"symbols": symbol_str, "fields": "regularMarketPrice,regularMarketChange,regularMarketChangePercent"},
            )
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return []

        points: list[DataPoint] = []
        results = data.get("quoteResponse", {}).get("result", [])
        for quote in results:
            sym = quote.get("symbol", "")
            info = symbols.get(sym)
            if not info:
                continue

            name, category, unit = info
            price = quote.get("regularMarketPrice", 0)
            change_pct = quote.get("regularMarketChangePercent", 0)

            points.append(DataPoint(
                source="yahoo_finance",
                category=category,
                key=name,
                value=price,
                unit=unit,
                timestamp=datetime.now(timezone.utc),
                metadata={
                    "symbol": sym,
                    "change_percent": round(change_pct, 2),
                    "change_absolute": round(quote.get("regularMarketChange", 0), 2),
                },
            ))
        return points

    async def health_check(self) -> bool:
        try:
            resp = await self._client.get(
                YAHOO_QUOTE_URL,
                params={"symbols": "GC=F"},
            )
            return resp.status_code == 200
        except Exception:
            return False
