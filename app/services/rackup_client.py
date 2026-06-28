# app/services/rackup_client.py
import os

import httpx

# Grab your Django backend URL from environment configurations
RACKUP_URL = os.getenv("RACKUP_URL", "http://127.0.0.1:8000")


class RackUpServiceClient:
    @classmethod
    async def fetch_tournament_match(cls, match_id: str) -> dict:
        """
        Queries the Django ledger (RackUp) to retrieve the official
        assigned player identities for a specific tournament match.
        """
        url = f"{RACKUP_URL}/api/matches/{match_id}/verify/"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, timeout=5.0)

                # If Django throws a 404 or a 500, raise an error immediately
                response.raise_for_status()

                # Returns: {"match_id": "999", "player1_id": "42", "player2_id": "7", ...}
                return response.json()

            except httpx.HTTPStatusError as e:
                # Handle explicit API error codes gracefully
                raise RuntimeError(f"RackUp rejected match verification: {e.response.status_code}")
            except httpx.RequestError as e:
                # Handle network-level downtimes/timeouts
                raise RuntimeError(f"Failed to connect to RackUp ledger service: {e}")

    @classmethod
    async def sync_final_frame(cls, match_id: str, payload: dict) -> bool:
        """Ships the final completed frame score matrix back to Django."""
        url = f"{RACKUP_URL}/api/matches/{match_id}/finalize/"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=5.0)
            return response.status_code == 201
