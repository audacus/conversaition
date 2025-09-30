# Status

**Date:** 2025-09-30
**State:** Enterprise-ready MVP, documentation optimization complete

## Current

Platform complete with participants management UI. Documentation restructure complete: consolidated 7 root docs → 5, removed redundancy, cut ~54% tokens (5,200→2,400 words).

**Features complete:**
- Multi-AI orchestration (Alice/OpenAI, Bob/Anthropic, Charlie/Gemini)
- Real-time SSE streaming
- Full conversation controls (start/pause/resume/stop/inject)
- Participants CRUD UI
- Analytics dashboard with transcript viewer
- E2E Playwright tests
- Dark theme UI

## Recent

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

1. Enhance analytics: Charts, filters, search
2. Export transcripts: JSON/Markdown download
3. Theme toggle: Allow user preference switching

## Blockers

None

## Recent Files Changed

**Modified:**
- backend/participants.py (added streaming=True for all providers)
- backend/participants_config.json (increased token limits for Bob/Charlie)
- backend/conversation_graph.py (detect/filter Gemini thinking tokens)
- STATUS.md (removed GitHub Actions, added streaming fixes)

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

**UI/UX (2025-09-30):**
- Dark-first design: gray-900 background, optimized text contrast
- Analytics routing: /analytics for list, /analytics/[filename] for detail

**Platform Core:**
- LangGraph orchestration
- External config (participants_config.json)
- Event broadcasting via SSE
- Thread-safe pause/resume
- Models: gpt-4o-mini, claude-sonnet-4-5-20250929, gemini-2.5-pro