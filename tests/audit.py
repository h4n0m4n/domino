"""Full audit of all scenarios, impacts, and edge cases."""

from pathlib import Path
from cascade.core.engine import CascadeEngine

SCENARIOS_DIR = Path("scenarios")

PROFILE = {
    "monthly_fuel_spend": 3000,
    "monthly_energy_bill": 2500,
    "monthly_groceries": 8000,
    "monthly_rent": 15000,
    "monthly_income": 45000,
    "savings": 150000,
}

EDGE_PROFILES = [
    ("empty", {}),
    ("zero_values", {"monthly_fuel_spend": 0, "monthly_energy_bill": 0, "monthly_groceries": 0, "savings": 0}),
    ("negative", {"monthly_fuel_spend": -100, "monthly_groceries": -500}),
    ("string_vals", {"monthly_fuel_spend": "abc", "savings": "xyz"}),
    ("huge_values", {"monthly_fuel_spend": 999999999, "savings": 999999999}),
    ("tiny_values", {"monthly_fuel_spend": 0.01, "savings": 0.01}),
]

bugs = []
warnings = []

print("=" * 70)
print("DOMINO FULL AUDIT")
print("=" * 70)

for f in sorted(SCENARIOS_DIR.glob("*.json")):
    engine = CascadeEngine()
    try:
        scenario = engine.load_scenario(f)
    except Exception as e:
        bugs.append(f"LOAD FAIL {f.name}: {e}")
        print(f"\n[BUG] {f.name}: Failed to load - {e}")
        continue

    chain = engine.active_chain
    all_ids = set(chain.nodes.keys())

    # Orphan children check
    orphans = []
    for node in chain.nodes.values():
        for cid in node.children:
            if cid not in all_ids:
                orphans.append(f"{node.id} -> {cid}")

    # Personal nodes check
    personal = [n for n in chain.nodes.values() if n.region == "personal"]

    # Magnitude sanity check
    crazy_magnitudes = [n for n in chain.nodes.values() if abs(n.magnitude) > 500]

    # Confidence range check
    bad_confidence = [n for n in chain.nodes.values() if n.confidence < 0 or n.confidence > 1]

    # Negative delay check
    bad_delay = [n for n in chain.nodes.values() if n.delay_days < 0]

    # Impact calculation
    summary = engine.summary(profile=PROFILE)
    impacts_with_cost = [i for i in summary.personal_impacts if i.monthly_cost_change != 0]

    # Empty profile check
    empty_summary = engine.summary(profile={})

    status = "OK"
    if orphans:
        status = "BUG"
        bugs.append(f"{f.name}: orphan children {orphans}")
    if not personal:
        status = "WARN"
        warnings.append(f"{f.name}: no personal nodes")
    if empty_summary.total_monthly_impact != 0:
        status = "BUG"
        bugs.append(f"{f.name}: empty profile gives non-zero impact")
    if crazy_magnitudes:
        warnings.append(f"{f.name}: extreme magnitudes {[n.id for n in crazy_magnitudes]}")
    if bad_confidence:
        bugs.append(f"{f.name}: confidence out of range {[n.id for n in bad_confidence]}")
    if bad_delay:
        bugs.append(f"{f.name}: negative delay {[n.id for n in bad_delay]}")

    print(f"\n[{status}] {f.name}")
    print(f"  Name: {scenario.name}")
    print(f"  Nodes: {chain.size} | Depth: {chain.total_depth()} | Sectors: {len(set(n.sector.value for n in chain.nodes.values()))}")
    print(f"  Personal nodes: {len(personal)}")
    print(f"  Orphans: {len(orphans)}")
    print(f"  Impact: monthly={summary.total_monthly_impact:+,.0f} TRY | annual={summary.total_annual_impact:+,.0f} TRY | runway={summary.savings_runway_months}")
    print(f"  Cost items: {len(impacts_with_cost)}")
    if orphans:
        print(f"  !! ORPHANS: {orphans}")
    if not personal:
        print(f"  !! NO PERSONAL NODES")
    if crazy_magnitudes:
        print(f"  !! EXTREME MAGNITUDES: {[n.id for n in crazy_magnitudes]}")

# Edge case profiles
print("\n" + "=" * 70)
print("EDGE CASE PROFILE TESTS")
print("=" * 70)

test_file = SCENARIOS_DIR / "hormuz_strait.json"
for name, prof in EDGE_PROFILES:
    engine = CascadeEngine()
    engine.load_scenario(test_file)
    try:
        summary = engine.summary(profile=prof)
        print(f"  [{name}] monthly={summary.total_monthly_impact:+,.0f} TRY - OK")
    except Exception as e:
        bugs.append(f"Edge case '{name}' crashed: {e}")
        print(f"  [{name}] CRASHED: {e}")

# Summary
print("\n" + "=" * 70)
print("AUDIT SUMMARY")
print("=" * 70)
print(f"  Scenarios tested: {len(list(SCENARIOS_DIR.glob('*.json')))}")
print(f"  Bugs found: {len(bugs)}")
print(f"  Warnings: {len(warnings)}")
for b in bugs:
    print(f"  BUG: {b}")
for w in warnings:
    print(f"  WARN: {w}")
if not bugs:
    print("  ALL CLEAR - No bugs detected")
