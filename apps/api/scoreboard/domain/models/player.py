from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Player:
    id: str  # External ID pointing to a player record in RackUp
    session_key: str  # For anonymous players, this can be the same as id
    name: str
    identity_type: str
    role: str

    def __init__(
        self,
        id: str,
        session_key: str,
        name: str,
        identity_type: str = "anonymous",
        role: str = "player",
    ) -> None:
        self.id = id
        self.session_key = session_key
        self.name = name
        self.identity_type = identity_type
        self.role = role
