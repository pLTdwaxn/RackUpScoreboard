from __future__ import annotations


class Participant:
    """Base class defining the unified interface for any table competitor."""

    def __init__(self, session_key: str, display_name: str, identity_type: str):
        self.session_key = session_key
        self.display_name = display_name
        self.identity_type = identity_type

    def to_dict(self) -> dict:
        return {
            "key": self.session_key,
            "name": self.display_name,
            "type": self.identity_type,
        }


class VerifiedParticipant(Participant):
    def __init__(self, user_id: str, username: str):
        super().__init__(
            session_key=f"user_{user_id}",
            display_name=username,
            identity_type="verified",
        )
        self.user_id = user_id


class AnonymousParticipant(Participant):
    def __init__(self, guest_slug: str, nickname: str):
        super().__init__(
            session_key=f"anon_{guest_slug}",
            display_name=nickname,
            identity_type="anonymous",
        )
        self.guest_slug = guest_slug
