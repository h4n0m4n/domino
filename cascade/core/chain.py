"""
CascadeChain — The connected domino sequence.

A chain is a directed acyclic graph (DAG) of CascadeNodes.
One root event triggers a tree of downstream effects.

Example:
    Hormuz blocked
    ├── Oil supply -8%
    │   ├── Fuel price +40%
    │   │   └── Transport cost +25%
    │   │       └── Food delivery +15%
    │   └── Natural gas +66%
    │       └── Electricity bill +30%
    └── Fertilizer supply -30%
        └── Wheat price +22%
            └── Bread price +18%
"""

from __future__ import annotations

from cascade.core.node import CascadeNode


class CascadeChain:
    """A directed acyclic graph of cascading impact nodes."""

    def __init__(self, root_id: str | None = None):
        self._nodes: dict[str, CascadeNode] = {}
        self._root_id: str | None = root_id

    @property
    def root(self) -> CascadeNode | None:
        if self._root_id and self._root_id in self._nodes:
            return self._nodes[self._root_id]
        return None

    @property
    def nodes(self) -> dict[str, CascadeNode]:
        return self._nodes

    @property
    def size(self) -> int:
        return len(self._nodes)

    def add_node(self, node: CascadeNode) -> None:
        """Add a node to the chain."""
        self._nodes[node.id] = node
        if self._root_id is None:
            self._root_id = node.id

    def connect(self, parent_id: str, child_id: str) -> None:
        """Connect two nodes: parent triggers child."""
        parent = self._nodes.get(parent_id)
        child = self._nodes.get(child_id)
        if not parent or not child:
            missing = parent_id if not parent else child_id
            raise KeyError(f"Node '{missing}' not found in chain")
        if child_id not in parent.children:
            parent.children.append(child_id)

    def get_children(self, node_id: str) -> list[CascadeNode]:
        """Get all direct downstream effects of a node."""
        node = self._nodes.get(node_id)
        if not node:
            return []
        return [self._nodes[cid] for cid in node.children if cid in self._nodes]

    def get_chain_from(self, node_id: str) -> list[CascadeNode]:
        """Get the full downstream cascade from a given node (BFS)."""
        result: list[CascadeNode] = []
        visited: set[str] = set()
        queue = [node_id]

        while queue:
            current_id = queue.pop(0)
            if current_id in visited:
                continue
            visited.add(current_id)

            node = self._nodes.get(current_id)
            if node:
                result.append(node)
                queue.extend(node.children)

        return result

    def get_full_cascade(self) -> list[CascadeNode]:
        """Get the entire cascade from root."""
        if not self._root_id:
            return []
        return self.get_chain_from(self._root_id)

    def get_by_sector(self, sector: str) -> list[CascadeNode]:
        """Filter nodes by sector."""
        return [n for n in self._nodes.values() if n.sector == sector]

    def total_depth(self, node_id: str | None = None) -> int:
        """Maximum depth of the cascade tree from a node."""
        start = node_id or self._root_id
        if not start or start not in self._nodes:
            return 0

        def _depth(nid: str, visited: set[str]) -> int:
            if nid in visited:
                return 0
            visited.add(nid)
            node = self._nodes.get(nid)
            if not node or not node.children:
                return 1
            return 1 + max(_depth(c, visited) for c in node.children)

        return _depth(start, set())

    def cumulative_delay_days(self, node_id: str) -> int:
        """Total delay from root to a specific node."""
        path = self._find_path(self._root_id, node_id)
        return sum(self._nodes[nid].delay_days for nid in path if nid in self._nodes)

    def _find_path(self, from_id: str | None, to_id: str) -> list[str]:
        """Find path from one node to another using DFS."""
        if not from_id:
            return []

        def _dfs(current: str, target: str, path: list[str]) -> list[str] | None:
            path.append(current)
            if current == target:
                return path
            node = self._nodes.get(current)
            if node:
                for child_id in node.children:
                    result = _dfs(child_id, target, path[:])
                    if result:
                        return result
            return None

        return _dfs(from_id, to_id, []) or []

    def to_dict(self) -> dict:
        """Serialize chain for JSON export."""
        return {
            "root_id": self._root_id,
            "node_count": self.size,
            "max_depth": self.total_depth(),
            "nodes": {nid: node.model_dump() for nid, node in self._nodes.items()},
        }
