# Status

**Date:** 2025-10-16
**State:** Human-as-participant implementation complete, ready for manual testing

**Session:** 2025-10-16 - Implemented Human as full conversation participant

## Current

**Features complete:**
- Multi-AI orchestration (Alice/OpenAI, Bob/Anthropic, Charlie/Gemini)
- Human as full participant (can be selected by coordinator, pause-to-inject still works)
- Intelligent LLM-based turn coordination (Gemini coordinator with structured output)
- Real-time SSE streaming with human input waiting
- Full conversation controls (start/pause/resume/stop/inject)
- Conversation persistence with URL-based reconnection
- Participants CRUD UI
- Analytics dashboard with transcript viewer and ongoing conversation tracking
- Message attribution with `<mention>` and `<request to="">` tags
- E2E Playwright tests
- Dark theme UI

## Recent

**Earlier work:** See [docs/archive/](docs/archive/) for Sept-Oct 2025 history

**Human-as-Participant (2025-10-16):**
- ✅ Added Human to participants_config.json (provider: "human")
- ✅ Backend: Async `_wait_for_human_input()` blocks until human responds
- ✅ Backend: `human_input_requested` event signals frontend when Human's turn
- ✅ Frontend: Orange highlight + "Your turn!" placeholder when Human selected
- ✅ Enhanced message parsing: `<request to="X">` and `<mention>X</mention>` tags
- ✅ Fixed ESLint warnings (useAISDKAdapter deps, unused variable)

**STATUS.md Archiving (2025-10-16):**
- ✅ Reduced STATUS.md from 281 to 79 lines (72% reduction)
- ✅ Archived Sept work to docs/archive/2025-09.md
- ✅ Archived Oct 1-14 work to docs/archive/2025-10.md
- ✅ Added archiving rule to CLAUDE.md (archive when exceeds 200 lines)
- ✅ Compressed Key Decisions section (removed date-specific items)

**CLAUDE.md Compression (2025-10-16):**
- ✅ Compressed CLAUDE.md from 130 to 108 lines (17% reduction)
- ✅ Removed Project Context section (redundant, discoverable from codebase)
- ✅ Removed Communication section (matches existing defaults)
- ✅ Removed Terseness principle (meta-commentary, already demonstrated)
- ✅ Streamlined Session Workflow (removed "validate environment" and "update STATUS with session start")
- ✅ Compressed Documentation Reference (removed redundant arrows)

**CLAUDE.md Improvements (2025-10-16):**
- ✅ Added conflict resolution rule (CLAUDE.md wins over system defaults)
- ✅ Clarified session start workflow (CLAUDE.md auto-loaded first)
- ✅ Added "Don't use TodoWrite for" section (single-step tasks, searches, questions)
- ✅ Relaxed communication rule (be concise by default, detail when analyzing/reviewing)
- ✅ Added git attribution note (system auto-appends, configure hooks to strip)

## Next

1. Expose usage_metadata to frontend (tokens, cache stats, reasoning)
2. Enhance analytics: Charts, filters, search
3. Phase 2 turn coordination: Context-aware direct question detection

## Blockers

None

## Recent Files Changed

**Modified (2025-10-16):**
- backend/conversation_graph.py (human input waiting, request/mention extraction)
- backend/main.py (inject endpoint: detect Human's turn vs manual injection)
- backend/participants.py (human provider support, coordinator includes Human)
- backend/participants_config.json (added Human participant)
- frontend/app/hooks/useAISDKAdapter.ts (human_input_requested handling, ESLint fix)
- frontend/app/page.tsx (orange highlight for Human's turn, ESLint fix)
- frontend/app/types/ai-sdk.ts (humanInputRequested state)
- CLAUDE.md (backend startup command fix)
- STATUS.md (documented human-participant work)

## Known Issues

- Long conversations (50+ turns) may need pagination
- Python 3.13 escape sequence warnings (cosmetic)
- Analytics: Some transcript metadata incomplete (duration/timestamps show NaN/Invalid Date)

## Key Decisions

**Documentation:**
- Terse, human-readable format: bullets over prose
- Single source of truth: link, don't duplicate
- No emoji except critical status (✅❌⚠️)
- STATUS.md: 5 bullets max per section, archive when exceeds 200 lines

**Platform Architecture:**
- LangGraph orchestration
- External config (participants_config.json)
- Event broadcasting via SSE
- Thread-safe pause/resume
- Atomic writes: temp+move prevents corruption
- URL-based reconnection with conversation ID
- StrictMode-safe React hooks (useSSEStream + useAISDKAdapter)