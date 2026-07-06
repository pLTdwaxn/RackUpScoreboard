from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class ConnectRequest(BaseModel):
    display_name: str
    matchroom_id: str | None = None


class ConnectResponse(BaseModel):
    instance_id: str
    display_name: str
    matchroom_id: str
    identity_type: str = "anonymous"


@router.post("/connect", response_model=ConnectResponse)
def connect_player(payload: ConnectRequest) -> ConnectResponse:
    display_name = payload.display_name.strip()
    if not display_name:
        raise HTTPException(status_code=400, detail="Display name is required.")

    submitted_matchroom = (payload.matchroom_id or "").strip()
    matchroom_id = submitted_matchroom or uuid4().hex[:8]

    return ConnectResponse(
        instance_id=uuid4().hex,
        display_name=display_name,
        matchroom_id=matchroom_id,
    )
