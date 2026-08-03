# RackUp Scoreboard

RackUp Scoreboard is a live snooker scoreboard for two players. It lets players create a matchroom, invite an opponent, keep score in real time, and record frame history either shot by shot or, where appropriate, by manually logging a whole break.

Live preview: <https://scoreboard-preview.abeesmall.cc/>

## How To Use

### Create A Matchroom

1. Open the live preview.
2. Choose **Create**.
3. Enter your display name.
4. Choose who keeps score:
   - **Opponent**: the player not at the table records the shot.
   - **Self**: the player at the table records their own shot.
   - **Free for All**: either player can record shots.
5. Create the matchroom.

The app currently creates a practice match with a best-of-5 winning condition.

### Invite The Other Player

After the first player enters the matchroom, the invite drawer opens with a QR code and room code.

The second player can join by either:

- scanning the QR code, or
- opening the app, choosing **Join**, entering their display name, and entering the matchroom ID.

Once both players are connected, the shared scoreboard updates for both devices.

### Scorekeep A Frame

Use the control panel at the bottom of the scoreboard.

- Tap a ball to record a legal pot.
- Use the foul control to declare a foul and select foul details.
- Use the advanced controls for multi-ball or more detailed shot input.
- Use the turn-switch/pass controls when a visit ends without a normal scored pot.
- Use undo to remove the latest recorded action.

Manual break logging is available only before shot-by-shot logging has started for the current visit. Once a visit has detailed shot entries, continue logging that visit shot by shot.

### Resolve Manual Break Composition

If a break was logged by total score only, the backend suggests possible ball compositions. The frame is treated as partially detailed until the missing composition is resolved. Open the unresolved frame log entry to review and resolve the suggested composition.

## Architecture

The project is a small full-stack app split into two deployable services:

- `apps/web`: a Next.js frontend using Hero UI. It handles the lobby, matchroom UI, QR invite flow, score controls, frame log rendering, and localised text.
- `apps/api`: a FastAPI backend. It owns matchroom state, scoring rules, action validation, frame orchestration, websocket updates, and persistence.

### Frontend

The frontend is intentionally state-projection driven. It does not try to be the source of truth for snooker scoring rules. Instead, it:

- creates or joins matchrooms through the API
- stores the local room/player session in the browser
- opens a websocket connection for live matchroom updates
- sends scorekeeping actions to the backend
- renders the scoreboard, control panel, frame overview, player cards, invite drawer, and frame log from backend-projected state
- keeps UI-only concerns local, such as open drawers, expanded frame-log entries, language selection, and composition suggestion filters

The score controls are split between simple ball tapping, advanced shot composition, and manual break logging. Manual break logging is treated as a controlled compromise: it is available only before shot-by-shot logging starts for the current visit.

### Backend

The backend is the scoring authority. Incoming player actions are handled in layers:

1. The frontend sends player actions such as `shot`, `log_break`, `pass_shot`, `reset_shot`, and `resolve_break_composition`.
2. The websocket route parses the client event and passes it to the matchroom action dispatcher.
3. Payload validation checks the action envelope and input shape.
4. Action policies check whether the requested action is allowed in the current frame state.
5. Action handlers call the frame orchestrator or supporting services.
6. Domain processors update scoring, break state, turn state, table state, foul state, frame completion, and match result state.
7. Frame history records the action, outcome, and undo snapshot.
8. Projectors turn domain objects into UI-friendly payloads.
9. The updated matchroom state is persisted and broadcast to connected clients.

This structure keeps action transport, validation, domain rules, scoring calculation, persistence, and UI projection separate.

### Domain Model

The main backend concepts are:

- **Matchroom**: the live room that players join. It tracks connected players, scorekeeping mode, current match, current frame, and next-frame confirmations.
- **Match**: the set of frames and the winning condition, currently created as a best-of-5 practice match.
- **Frame**: the active scoring state, including scores, current turn, current break, table state, foul state, rule state, frame history, and winner.
- **Frame history**: the undoable record of scorekeeping actions. Each entry stores the original event, calculated outcome, and a snapshot of the state before the action.
- **Frame log**: a projected, human-readable visit log derived from frame history.

### Action Policies And Orchestration

Contextual action rules live in backend policies. For example, policies decide whether a player can start manual break logging, pass after a foul, reset a foul-and-miss shot, or declare a free ball. This keeps handlers from mixing transport workflow with frame eligibility rules.

Scoring changes go through the frame orchestrator. The orchestrator routes actions through focused processors for scoring, breaks, fouls, turn changes, table phase, next ball, remaining points, snookers required, and win conditions.

### Manual Break Composition

Manual break logging records a break total without immediate shot-by-shot detail. The backend accepts the break total, generates possible compositions, and marks the entry unresolved until a composition is selected. While unresolved, the frame can be treated as partially detailed because table-derived values such as reds remaining and snookers required may be unknown.

### Persistence And Realtime Updates

The backend uses a repository abstraction for matchroom storage. Local development can use in-memory storage, while deployment can use Redis-backed storage. After each accepted action, the backend saves the updated matchroom and broadcasts the projected state to every websocket connected to that room.

This keeps the scoring engine data-driven and backend-owned while the frontend stays focused on fast input and clear matchroom interaction.

## Under Development

Finished match data will later be uploaded to RackUp so completed frames and matches can update:

- player personal stats
- club competition records, when the match carries club and tournament details

## Local Development

Frontend details live in [apps/web/README.md](apps/web/README.md).

Common checks:

```bash
.venv/bin/python -m pytest -q apps/api/tests
cd apps/web && npm test
```
