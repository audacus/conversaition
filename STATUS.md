# Status

**Date:** 2025-09-29
**State:** Enterprise-ready MVP, documentation optimization in progress

## Current

Platform complete with participants management UI. Documentation restructure underway: consolidating 7 root docs → 5, removing redundancy, cutting ~50% tokens.

**Features complete:**
- Multi-AI orchestration (Alice/OpenAI, Bob/Anthropic, Charlie/Gemini)
- Real-time SSE streaming
- Full conversation controls (start/pause/resume/stop/inject)
- Participants CRUD UI
- Transcript persistence + analytics endpoints
- E2E Playwright tests

## Recent

**Documentation Restructure (2025-09-29):**
- Created SETUP.md (compressed from GETTING_STARTED.md, 736→300 words)
- Created DEV.md (compressed from DEVELOPMENT.md, 599→250 words)
- Creating STATUS.md (from PROGRESS.md, 1299→300 words target)
- Moving ARCHITECTURE.md → docs/ (reference material)
- Updating CLAUDE.md with terseness rules + AGENTS.md content
- Deleting redundant files: AGENTS.md, GETTING_STARTED.md, DEVELOPMENT.md, PROGRESS.md

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

1. CI/CD: Add Playwright to GitHub Actions
2. Analytics UI: Surface transcripts in dashboard
3. Model upgrades: Consider gemini-2.5-pro, gpt-o4-mini

## Blockers

None

## Recent Files Changed

**Created:**
- SETUP.md (compressed setup guide)
- DEV.md (compressed dev guide)
- STATUS.md (this file, replaces PROGRESS.md)

**Modified (pending):**
- CLAUDE.md (terseness rules + project context)
- README.md (updated doc links)

**Moved (pending):**
- ARCHITECTURE.md → docs/ARCHITECTURE.md

**Deleted (pending):**
- AGENTS.md (absorbed by CLAUDE.md)
- GETTING_STARTED.md (replaced by SETUP.md)
- DEVELOPMENT.md (replaced by DEV.md)
- PROGRESS.md (replaced by STATUS.md)

## Known Issues

- Stop button closes SSE but backend continues until natural end
- Long conversations (50+ turns) may need pagination
- Python 3.13 escape sequence warnings (cosmetic)

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

**Platform Core:**
- LangGraph orchestration
- External config (participants_config.json)
- Event broadcasting via SSE
- Thread-safe pause/resume
- Models: gpt-4.1-mini, claude-sonnet-4-20250514, gemini-2.5-flash