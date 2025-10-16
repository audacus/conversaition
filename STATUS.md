# Status

**Date:** 2025-10-16
**State:** Usage metadata exposure complete, tokens/cache/reasoning now visible in UI

**Session:** 2025-10-16 - Exposed usage_metadata to frontend

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
- Usage metrics exposed (input tokens, output tokens, cache read, reasoning tokens)
- E2E Playwright tests
- Dark theme UI

## Recent

**Usage Metadata Exposure (2025-10-16):**
- ✅ Backend: Accumulate usage_metadata from LLM streaming chunks
- ✅ Backend: Include usage_metadata in ai_response_complete event
- ✅ Frontend: Added UsageMetadata type interface
- ✅ Frontend: Store usage metadata in message objects
- ✅ Frontend: Display tokens/cache stats inline with messages (↓ in, ↑ out, ⚡ cache)

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

1. Enhance analytics: Charts, filters, search
2. Phase 2 turn coordination: Context-aware direct question detection
3. Performance optimization: Implement pagination for 50+ message conversations

## Blockers

None

## Recent Files Changed

**Modified (2025-10-16 usage metadata):**
- backend/conversation_graph.py (capture final_usage_metadata from chunks)
- backend/adapter.py (expose usage_metadata in text-done event)
- frontend/app/types/ai-sdk.ts (added UsageMetadata interface)
- frontend/app/hooks/useAISDKAdapter.ts (store usage in message)
- frontend/app/page.tsx (display usage stats inline)

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