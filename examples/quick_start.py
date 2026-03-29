"""
Quick Start — See the Iran war cascade hit your wallet in 10 lines.
"""

from cascade.core.engine import CascadeEngine

engine = CascadeEngine()
engine.load_scenario("scenarios/hormuz_strait.json")

summary = engine.summary(profile={
    "monthly_fuel_spend": 3000,     # ₺/month on fuel
    "monthly_energy_bill": 2500,    # ₺/month electricity + gas
    "monthly_groceries": 8000,      # ₺/month food
    "monthly_rent": 15000,          # ₺/month rent
    "monthly_income": 45000,        # ₺/month income
    "savings": 150000,              # ₺ total savings
    "profession": "software_dev",
    "city": "istanbul",
    "family_size": 3,
})

print(f"Scenario: {summary.scenario_name}")
print(f"Cascade depth: {summary.max_depth} levels, {summary.total_nodes} nodes")
print(f"Monthly hit: ₺{summary.total_monthly_impact:+,.0f}")
print(f"Annual hit:  ₺{summary.total_annual_impact:+,.0f}")
if summary.savings_runway_months:
    print(f"Your savings last: {summary.savings_runway_months} months")

print("\nBreakdown:")
for impact in summary.personal_impacts:
    if impact.monthly_cost_change != 0:
        print(f"  {impact.description}")
