# Master vs Codex Merge Guide

## Objective
Ensure `master` keeps the strongest implementation of core technical challenges (LangGraph orchestration, SSE streaming, multi-agent UI) while borrowing superior ideas from `codex` where it meaningfully improves functionality, stability, or UX.

---

## Backend Comparison

### Conversation Graph (`backend/conversation_graph.py`)
- **Keep from `master`:** streamlined round-robin flow is stable, but it lost useful state syncing.
- **Adopt from `codex`:**
  - Reintroduce `self.current_state` updates after scheduler/response nodes so pause/resume and human injection operate on the latest state.
  - Restore `preferred_next_speaker` / `preferred_bias_remaining` / `round_robin_pointer` fields to support targeted turn nudging.
  - Bring back `_apply_preferred_speaker` + mention parsing (`@Name`) and pointer logic so explicit callouts drive the next turn instead of pure round-robin.
  - Capture `current_participants` / `current_topic` attributes on the graph when a session starts so status broadcasts and pause/resume share the same source of truth.
- **Extra:** If mention bias returns, align prompts (see below) and add lightweight unit tests around state sync + preference fallbacks.

### Participant Configuration (`backend/participants.py`)
- **Keep from `master`:** current personalities and temperature settings work.
- **Adopt from `codex`:**
  - Increase `max_tokens` ceiling (150 → 250) to prevent truncated replies when conversations deepen.
  - Update system prompts to require `@Name` mentions, matching the preferred-speaker logic.

### Conversation API (`backend/main.py`)
- **Keep from `master`:** new `conversation_status` broadcasts on start/pause/resume are valuable.
- **Fix:** persist `current_topic` / `current_participants` on the `ConversationGraph` when a session starts so status events avoid defaulting to `['Alice','Bob','Charlie']`. Today those attributes never exist, so pause/resume status drifts.
- **Consider:** add a `/conversation/stop` endpoint if the UI continues exposing a Stop control.

### LangGraph → AI SDK Adapter (`backend/adapter.py`)
- **Keep from `master`:** `format_for_sse` / `generate_sse_stream` now yield raw JSON strings (no extra `data:` prefix) which fixed the double-envelope bug.
- **Enhance:** add an explicit case for `conversation_status` events so downstream code need not unwrap the generic `conversation-event` payload.

---

## Frontend Comparison

### SSE Stream Hook (`frontend/app/hooks/useSSEStream.ts`)
- **Keep from `master`:** StrictMode-safe connection guard and handler swapping solve the duplicate-stream bug.
- **Adopt from `codex`:** offer a thin wrapper (`connect`/`disconnect`) around `startStream`/`stopStream` so existing components can keep their simpler API while benefiting from the new guard logic.

### AI SDK Adapter Hook (`frontend/app/hooks/useAISDKAdapter.ts`)
- **Keep from `master`:**
  - Conversation status merging (`conversation_status`, pause/resume events).
  - Deterministic message IDs and `pendingMessageIdRef` to stitch deltas.
- **Adopt from `codex`:**
  - Restore adapter meta state (`currentSpeaker`, `thinkingParticipant`, `turn`) for richer UI cues.
  - Reintroduce `role` / `isStreaming` metadata so avatars & system messaging can render distinctly.
  - Preserve human/system message handling from codex while layering the newer status logic.

### Conversation API Hook (`frontend/app/hooks/useConversationApi.ts`)
- **Keep from `master`:** built-in `loading` / `error` tracking.
- **Keep syncing from `master`:** expose the cached `status` value so components can react without re-fetching.
- **Adopt from `codex`:** accept a configurable `baseUrl` (default to env) and return typed payloads; eliminates the hard-coded `http://localhost:8000` constraint.

### Page Component (`frontend/app/page.tsx`)
- **Keep from `master`:**
  - Participant selection UI.
  - Connection + status chips; event-driven status updates.
- **Adopt from `codex`:**
  - Avatar rendering (restore removed SVG assets or swap with new ones) and `role`-aware styling.
  - Display of active speaker / turn metadata once adapter exposes it again.
  - Bring back explicit error banners so API/SSE failures surface to the operator.
  - Human message send guard (codex only allows inject while paused—decide desired behavior and align).
- **Fix:** `Stop` button currently only closes SSE; either remove it or wire it to a backend stop endpoint.

### Types (`frontend/app/types/*`)
- Merge both approaches: keep AI SDK event unions plus meta/message shapes (including `role`, `isStreaming`, `timestamp`, `complete`) in one place; re-export `ConversationStatus` structs used by the adapter so hooks and UI share a single source of truth.

### Assets (`frontend/public/*.svg`)
- Codex avatars were deleted on `master`. Decide whether to reintroduce them or ship alternative visuals so the richer UI has assets available.

---

## Testing & Tooling
- Reinstate automated smoke covering mention-based scheduling and human injection once `ConversationGraph` state syncing is restored.
- Frontend: add regression coverage (Playwright or unit) to ensure StrictMode mounts do not duplicate streams and that status badges respond to synthetic `conversation_status` events.

---

## Documentation & Process
- `CLAUDE.md` on `master` captures the enforced workflow (PROGRESS logging, commit style); ensure it survives the merge and reconcile any conflicting guidance on `codex`.
- Keep the new ADRs (`docs/adr/003`–`006`) and backfill them on `codex` if missing so architecture history remains linear.
- Update `README.md` / `.env.example` only where `master` has fresher instructions; avoid regressing credential or setup guidance that `codex` may still use.

---

## Open Questions / Follow-ups
1. Should mention-driven scheduling be optional (feature flag) for enterprise customers? (Impacts prompts + UI.)
2. Do we need a backend `/stop` endpoint to support the Stop control introduced on `master`?
3. How should connection configuration (API base URL) be managed across environments—env var or runtime setting?
