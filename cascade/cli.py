"""
Domino CLI — Run cascade simulations from the terminal.

Usage:
    domino simulate scenarios/hormuz_strait.json
    domino simulate scenarios/hormuz_strait.json --profile '{"monthly_groceries": 8000}'
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.tree import Tree

from cascade.core.engine import CascadeEngine

console = Console()


def render_cascade_tree(engine: CascadeEngine) -> Tree:
    """Render the cascade as a visual tree in the terminal."""
    chain = engine.active_chain
    if not chain or not chain.root:
        return Tree("[red]No cascade loaded[/red]")

    root_node = chain.root
    tree = Tree(
        f"[bold red]>> {root_node.event}[/bold red]  "
        f"[dim]({root_node.source})[/dim]"
    )

    def _add_children(parent_tree: Tree, node_id: str, visited: set[str]) -> None:
        if node_id in visited:
            return
        visited.add(node_id)

        for child in chain.get_children(node_id):
            severity_color = {
                "critical": "red",
                "severe": "yellow",
                "significant": "cyan",
                "moderate": "green",
                "minor": "dim",
            }.get(child.severity, "white")

            delay_str = f"+{child.delay_days}d" if child.delay_days > 0 else "instant"
            label = (
                f"[{severity_color}]→ {child.event}[/{severity_color}]  "
                f"[bold]{child.impact_label()}[/bold]  "
                f"[dim]({delay_str}, confidence: {child.confidence:.0%})[/dim]"
            )
            child_tree = parent_tree.add(label)
            _add_children(child_tree, child.id, visited)

    _add_children(tree, root_node.id, set())
    return tree


def cmd_simulate(args: argparse.Namespace) -> None:
    """Run a cascade simulation."""
    path = Path(args.scenario)
    if not path.exists():
        console.print(f"[red]Scenario file not found: {path}[/red]")
        sys.exit(1)

    engine = CascadeEngine()
    scenario = engine.load_scenario(path)

    console.print()
    console.print(Panel(
        f"[bold]{scenario.name}[/bold]\n{scenario.description}",
        title="[SCENARIO]",
        border_style="blue",
    ))

    console.print()
    console.print("[bold]Cascade Chain:[/bold]")
    console.print(render_cascade_tree(engine))

    profile = {}
    if args.profile:
        profile = json.loads(args.profile)

    if profile:
        console.print()
        summary = engine.summary(profile=profile)

        table = Table(title="Personal Impact Breakdown", border_style="red")
        table.add_column("Event", style="white")
        table.add_column("Sector", style="cyan")
        table.add_column("Impact/Month", justify="right", style="bold red")
        table.add_column("When", justify="right", style="yellow")

        for impact in summary.personal_impacts:
            if impact.monthly_cost_change != 0:
                table.add_row(
                    impact.event,
                    impact.sector.value if hasattr(impact.sector, "value") else str(impact.sector),
                    f"₺{impact.monthly_cost_change:+,.0f}",
                    f"+{impact.delay_days}d",
                )

        console.print(table)

        console.print()
        console.print(Panel(
            f"[bold red]Monthly impact: ₺{summary.total_monthly_impact:+,.0f}[/bold red]\n"
            f"[bold red]Annual impact:  ₺{summary.total_annual_impact:+,.0f}[/bold red]\n"
            + (
                f"[bold yellow]Savings runway: {summary.savings_runway_months} months[/bold yellow]"
                if summary.savings_runway_months
                else ""
            ),
            title="TOTAL PERSONAL IMPACT",
            border_style="red",
        ))
    else:
        console.print()
        console.print(
            "[dim]Tip: Add --profile to see personal impact. Example:[/dim]\n"
            '[dim]  domino simulate scenarios/hormuz_strait.json --profile \'{"monthly_fuel_spend": 3000, "monthly_energy_bill": 2500, "monthly_groceries": 8000, "savings": 150000}\'[/dim]'
        )


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="domino",
        description="Domino — Cascading Impact Simulation Engine",
    )
    subparsers = parser.add_subparsers(dest="command")

    sim_parser = subparsers.add_parser("simulate", help="Run a cascade simulation")
    sim_parser.add_argument("scenario", help="Path to scenario JSON file")
    sim_parser.add_argument(
        "--profile",
        help="JSON string with personal financial profile",
        default=None,
    )

    args = parser.parse_args()

    if args.command == "simulate":
        cmd_simulate(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
