# Status

**Date:** 2025-10-01
**State:** MVP with critical bugs requiring fixes

## Current

Platform complete with participants management UI. Documentation restructure complete: consolidated 7 root docs → 5, removed redundancy, cut ~54% tokens (5,200→2,400 words).

**Features complete:**
- Multi-AI orchestration (Alice/OpenAI, Bob/Anthropic, Charlie/Gemini)
- Real-time SSE streaming
- Full conversation controls (start/pause/resume/stop/inject)
- Conversation persistence with URL-based reconnection
- Participants CRUD UI
- Analytics dashboard with transcript viewer and ongoing conversation tracking
- E2E Playwright tests
- Dark theme UI

## Recent

**Bug Fixes (2025-10-01):**
- ✅ Fixed @Name placeholder in system prompts (participants now use actual names: Alice, Bob, Charlie)
- ⚠️ Partially fixed SSE race condition causing first message attribution bug
  - Root cause: Backend emits events before frontend SSE connection established
  - Fixed: adapter.py passes participant field in user-message events
  - Fixed: page.tsx connects to SSE before calling startConversation
  - Remaining: Connection is async, events still emitted before client ready
  - Solution needed: Backend must wait for SSE client connection before starting conversation
- ✅ Fixed analytics showing "undefined" in transcript URLs (added filename field)
- ✅ Fixed Gemini (Charlie) leaking system prompt instructions (use system_instruction parameter)
- ✅ Fixed empty messages in transcripts (filter whitespace-only messages during persistence)

**Conversation Persistence (2025-09-30):**
- ✅ Conversation ID generation and URL tracking
- ✅ Message restoration on reconnection
- Backend: UUID generation, snapshot endpoint, conversation state tracking
- Frontend: URL updates with conversation ID, reconnection from URL with message restoration
- Analytics: Ongoing conversations shown with "Rejoin" button
- Option A behavior: Conversations continue in background when navigating away
- Fix: Added restoreMessages method, used ref for reconnection tracking to prevent re-render loops
- Note: Message attribution issue documented (participants can't reference each other)

**Stop Endpoint Fix (2025-09-30):**
- ✅ Fixed duration_seconds variable scope error in stop endpoint
- Root cause: duration_seconds used before assignment in transcript persist
- Solution: Calculate duration before persist call
- Verified: Stop endpoint returns correct duration

**Gemini Streaming Fix (2025-09-30):**
- ✅ Fixed Gemini streaming: was working but emitting whitespace during reasoning
- Root cause: Gemini 2.5 Pro outputs newlines during 200-1300 reasoning tokens
- Solution: Skip whitespace-only chunks when reasoning metadata present
- Verified: Charlie now streams properly without leading newlines

**Streaming Analysis (2025-09-30):**
- Added comprehensive metadata logging for all providers
- Analyzed streaming patterns: Alice (~40-80 chunks), Bob (~9 chunks, efficient)
- Discovered Gemini streaming broken: only 1 empty chunk despite streaming=True
- Removed GitHub Actions CI workflow (not in use)

**Streaming Fixes (2025-09-30):**
- Fixed Bob/Charlie streaming: added streaming=True to all LangChain models
- Detect Gemini thinking tokens via usage_metadata.output_token_details.reasoning
- Increased token limits: Bob 1024, Charlie 2048 (account for prompt overhead)

**UI & Infrastructure (2025-09-30):**
- Implemented dark theme: gray-900 base, optimized contrast
- Upgraded models: gpt-4o-mini, claude-sonnet-4-5-20250929, gemini-2.5-pro
- Built analytics UI: transcript list + detail views with metadata

**Documentation Restructure (2025-09-29):**
- Created SETUP.md (compressed from GETTING_STARTED.md, 736→300 words)
- Created DEV.md (compressed from DEVELOPMENT.md, 599→250 words)
- Created STATUS.md (from PROGRESS.md, 1299→300 words)
- Moved ARCHITECTURE.md → docs/ (reference material)
- Updated CLAUDE.md with terseness rules + AGENTS.md content
- Deleted redundant files: AGENTS.md, GETTING_STARTED.md, DEVELOPMENT.md, PROGRESS.md

**Documentation Reorganization (2025-09-29):**
- Streamlined README (841→133 lines)
- Created comprehensive docs structure: API ref, ADR index, implementation plans
- Removed RUNNING.md (migrated to GETTING_STARTED/DEVELOPMENT)

**Playwright Tests (2025-09-29):**
- Full CRUD test suite passing
- Fixed accessibility labels + strict mode selectors
- Synchronized API requests for test reliability

**Participants Management (2025-09-29):**
- REST API: GET/POST/PUT/DELETE /participants
- Atomic JSON writes (temp+move pattern)
- Validation: provider allowlist, range checks
- UI: modal forms, delete confirmation, auto-refresh

**Platform Foundation (Sept 2025):**
- Event-driven status (eliminated 2s polling)
- LangGraph orchestration + SSE streaming
- React UI with TypeScript hooks
- Fixed Gemini streaming, reinforced personas
- External participant config

## Next

1. **CRITICAL**: Fix SSE race condition (first message shows wrong attribution)
   - Backend must wait for at least one SSE client before starting conversation
   - Options: Add ready signal, delay start until client connected, queue early events
   - Affects: All new conversations show Alice's content under "System" label
2. Message attribution: Participants can't reference each other (messages lack speaker names in history)
   - Solution: Pre-process messages before LLM input to include "Speaker: content" format
   - Must be compatible with streaming (transform before passing to LLM)
3. Expose usage_metadata to frontend (tokens, cache stats, reasoning)
4. Fix stop button SSE behavior (backend continues after close)
5. Enhance analytics: Charts, filters, search

## Blockers

None

## Recent Files Changed

**Modified (2025-10-01):**
- backend/adapter.py (pass participant field in user-message events for SSE race condition)
- frontend/app/page.tsx (connect to SSE before startConversation to reduce race window)
- frontend/app/hooks/useAISDKAdapter.ts (removed debug console logs)
- backend/participants_config.json (removed @Name placeholder, use actual names)
- backend/participants.py (Gemini system_instruction parameter, return system_prompt tuple)
- backend/conversation_graph.py (emit initial topic message event, conditional system prompt)
- backend/storage.py (filename field for analytics, filter empty messages)
- STATUS.md (documented SSE race condition investigation and partial fixes)

**Modified (2025-09-30):**
- backend/conversation_graph.py (conversation ID tracking, snapshot method)
- backend/main.py (conversation ID in responses, snapshot endpoint)
- frontend/app/page.tsx (URL-based persistence, reconnection logic)
- frontend/app/hooks/useConversationApi.ts (snapshot fetching)
- frontend/app/hooks/useAISDKAdapter.ts (restoreMessages method)
- frontend/app/analytics/page.tsx (ongoing conversation display)

## Known Issues

- Stop button closes SSE but backend continues until natural end
- Long conversations (50+ turns) may need pagination
- Python 3.13 escape sequence warnings (cosmetic)
- Analytics: Some transcript metadata incomplete (duration/timestamps show NaN/Invalid Date)

## Key Decisions

**Documentation (2025-09-29):**
- Terse, human-readable format: bullets over prose
- Single source of truth: link, don't duplicate
- No emoji decoration except critical status (✅❌⚠️)
- STATUS.md enforces brevity: 5 bullets max per section

**Participants Management (2025-09-29):**
- Atomic writes: temp+move prevents corruption
- Centralized validation in participants.py
- REST design with proper HTTP verbs
- Auto-refresh on visibility change

**SSE Architecture (2025-09-27):**
- Hook separation: useSSEStream + useAISDKAdapter
- StrictMode safe: single global callback
- Centralized status propagation

**Conversation Persistence (2025-09-30):**
- URL-based reconnection: Conversation ID in query params
- Continue in background: Conversations persist when navigating away
- Analytics integration: Ongoing conversations highlighted with rejoin button
- Snapshot endpoint: GET /conversation/snapshot for state restoration

**UI/UX (2025-09-30):**
- Dark-first design: gray-900 background, optimized text contrast
- Analytics routing: /analytics for list, /analytics/[filename] for detail

**Platform Core:**
- LangGraph orchestration
- External config (participants_config.json)
- Event broadcasting via SSE
- Thread-safe pause/resume
- Models: gpt-4o-mini, claude-sonnet-4-5-20250929, gemini-2.5-pro