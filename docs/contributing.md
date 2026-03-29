# Contributing to Domino

Thank you for contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/domino.git
cd domino

# Backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\Activate.ps1 on Windows
pip install -e ".[dev]"
pytest tests/

# Frontend
cd web
npm install
npm run dev
```

## How to Contribute

### Add a New Scenario

1. Create a JSON file in `scenarios/` following the existing format
2. Each node needs: `id`, `event`, `detail`, `sector`, `magnitude`, `unit`, `direction`, `delay_days`, `confidence`, `source`, `children`
3. Use real data and cite sources
4. End chains with personal impact nodes (region: "personal")
5. Add the scenario to `web/app/scenario-data.ts`

### Add a Data Provider

1. Create a new file in `cascade/data/providers/`
2. Extend `BaseProvider` from `base.py`
3. Implement `fetch()` and `health_check()`
4. Register in `cascade/data/aggregator.py`

### Improve the Visualization

The frontend is in `web/` (Next.js + Tailwind CSS). Key files:
- `web/app/page.tsx` — Main page and all components
- `web/app/globals.css` — Animations and theme
- `web/app/scenario-data.ts` — Scenario definitions

## Code Style

- Python: ruff (`ruff check . --fix`)
- TypeScript: ESLint
- Commits: conventional commits (`feat:`, `fix:`, `docs:`)

## Scenario Guidelines

Good scenarios are:
- **Data-driven** — every node cites a real source
- **Quantified** — magnitude in %, delay in days
- **Connected** — clear cause-effect chain
- **Personal** — ends with impact on individual finances
- **Honest** — confidence scores reflect real uncertainty
