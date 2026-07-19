from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from scoreboard.domain.services.matchroom_service import matchroom_service

router = APIRouter()


class ConnectRequest(BaseModel):
    display_name: str
    matchroom_id: str | None = None
    score_keeper: Literal["self", "opp", "ref", "any"] = "opp"


class ConnectResponse(BaseModel):
    # instance_id: str
    matchroom_id: str
    display_name: str
    player_key: str
    identity_type: str = "anonymous"  # Not needed for now.


@router.post("/connect", response_model=ConnectResponse)
def connect_player(payload: ConnectRequest) -> ConnectResponse:
    display_name = payload.display_name.strip()
    if not display_name:
        raise HTTPException(status_code=400, detail="Display name is required.")

    session_key = uuid4().hex[:8]

    matchroom = matchroom_service.connect_player_to_matchroom(
        {
            "id": (payload.matchroom_id or "").strip(),
            "score_keeper": payload.score_keeper,
        },
        {"id": "", "session_key": session_key, "display_name": display_name},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )

    return ConnectResponse(
        # instance_id=uuid4().hex[:8],
        display_name=display_name,
        matchroom_id=matchroom.id,
        player_key=session_key,
    )
