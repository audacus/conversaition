# Status

**Date:** 2025-10-14
**State:** MVP stable, coordinator improvements complete

## Current

**Features complete:**
- Multi-AI orchestration (Alice/OpenAI, Bob/Anthropic, Charlie/Gemini)
- Intelligent LLM-based turn coordination (Gemini gemini-2.5-flash-lite coordinator with structured output)
- Real-time SSE streaming
- Full conversation controls (start/pause/resume/stop/inject)
- Conversation persistence with URL-based reconnection
- Participants CRUD UI
- Analytics dashboard with transcript viewer and ongoing conversation tracking
- Message attribution (participants can reference each other by name)
- E2E Playwright tests
- Dark theme UI

## Recent

**Stop Button Fix (2025-10-14):**
- ✅ Fixed stop button behavior - backend now terminates immediately
- ✅ Added `conversation_active` check in `_route_after_pause_check` to exit before expensive AI response
- ✅ Added early exit guard in `_generate_ai_response` for redundancy
- ✅ Tested: Conversation stops mid-stream when stop clicked (9s vs continuing indefinitely)
- **Changes:** conversation_graph.py:611-616 (routing check), conversation_graph.py:410-413 (early exit)

**Coordinator Improvements - Phase 2 (2025-10-14):**
- ✅ Coordinator model switch: gpt-4o-mini → gemini-2.5-flash-lite (faster, cheaper, structured output)
- ✅ Structured output: Gemini uses `.with_structured_output(CoordinatorDecision)` for type-safe responses
- ✅ Dynamic participant descriptions: Loaded from config instead of hardcoded in prompt
- ✅ Simplified coordinator prompt: Removed hardcoded participant list and JSON format instructions
- ✅ Tested: 8 coordinator decisions with good reasoning across 2 test runs
- **Changes:** participants_config.json (cleaner prompt), conversation_graph.py:155-166 (dynamic descriptions), participants.py:164-173 (structured output for Gemini)

**LLM-Based Turn Coordination - Phase 1 Complete (2025-10-14):**
- ✅ TESTED AND WORKING: Intelligent LLM-based speaker selection operational
- ✅ Coordinator: OpenAI gpt-4o-mini with JSON mode
- ✅ Turn decisions with reasoning: "Bob's creative perspective essential", "Charlie provides contrarian view"
- ✅ Fallback to round-robin working correctly on coordinator errors
- ✅ Message format: `<message from="Name">content</message>` for attribution
- ✅ Graph flow: turn_coordinator → pause_check → ai_response
- ✅ Shared base prompt (_system_prompt_base) for communication rules
- **Architecture:** docs/adr/007-llm-based-turn-coordination.md
- **Test:** Multi-turn conversation successfully coordinated (Bob→Charlie→Alice pattern)
- **Changes:** participants_config.json, participants.py, conversation_graph.py

**Frontend SSE Event Handling - Complete Fix (2025-10-14):**
- ✅ FULLY FIXED: React async state + rapid SSE events + StrictMode double-invocation
- ✅ All messages now display correctly across multiple turns
  - Root cause: React's async setState queued message creation, but text-delta arrived before state update completed
  - Solution: Lazy message creation - text-delta creates message on-demand if it doesn't exist yet
  - Guard key issue resolved: Clear messageCreationGuardRef on turn-complete event
  - Changes: useAISDKAdapter.ts:312 (clear guard in turn-complete handler)
- ✅ Fixed attribution prefix leaking in displayed messages
  - Solution: Strip prefixes with regex `/^<\/?[^>]+>\s*/g` in display layer
  - Changes: page.tsx (stripAttributionPrefix function)
- ✅ Removed debug console.log statements
- **Investigation doc:** docs/archive/2025-10-14-sse-react-async-state-fix.md documents root cause analysis, solution options

**Message Attribution (2025-10-01):**
- ✅ Implemented message preprocessing with speaker attribution
- Added `_preprocess_messages_with_speakers` method in conversation_graph.py
- Messages now prefixed with `<Name>` format for LLM context
- Updated system prompts to instruct LLMs not to echo format
- Verified: Participants now reference each other by name in conversations
- Changes: conversation_graph.py, participants_config.json

**Bug Fixes (2025-10-01):**
- ✅ Fixed SSE race condition causing first message attribution bug
  - Root cause: Backend emitted events before frontend SSE connection established
  - Solution: Backend waits for SSE client ready signal (asyncio.Event) before starting conversation
  - Changes: adapter.py tracks client_ready event, main.py waits with 5s timeout
  - Verified: All messages now show correct participant attribution
- ✅ Fixed @Name placeholder in system prompts (participants now use actual names: Alice, Bob, Charlie)
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

1. Expose usage_metadata to frontend (tokens, cache stats, reasoning)
2. Enhance analytics: Charts, filters, search
3. Phase 2 turn coordination: Context-aware direct question detection

## Blockers

None

## Recent Files Changed

**Modified (2025-10-14 - Stop Button Fix):**
- backend/conversation_graph.py:611-616 (check conversation_active in _route_after_pause_check)
- backend/conversation_graph.py:410-413 (early exit in _generate_ai_response if not active)
- STATUS.md (documented stop button fix, removed from Next/Known Issues)

**Modified (2025-10-14 - Coordinator Improvements):**
- backend/participants_config.json (cleaned coordinator prompt, removed hardcoded participant list)
- backend/conversation_graph.py:155-166 (dynamic participant descriptions from config)
- backend/participants.py:164-173 (Gemini structured output with CoordinatorDecision Pydantic model)
- STATUS.md (documented coordinator improvements)

**Modified (2025-10-14 - Turn Coordinator):**
- backend/participants_config.json (added _system_prompt_base, _coordinator config, simplified participant prompts)
- backend/participants.py (load coordinator config, prepend base prompt, create_coordinator_llm function)
- backend/conversation_graph.py (turn_coordinator node, <message> format, updated graph flow)
- docs/adr/007-llm-based-turn-coordination.md (NEW: LLM-based turn coordination decision)
- docs/adr/README.md (added ADR 007 to index)
- STATUS.md (updated with turn coordinator implementation status)

**Modified (2025-10-14 - SSE Fix):**
- frontend/app/hooks/useAISDKAdapter.ts:312 (clear messageCreationGuardRef on turn-complete, removed debug logs)
- docs/archive/2025-10-14-sse-react-async-state-fix.md (documented final solution)

**Modified (2025-10-01):**
- backend/conversation_graph.py (_preprocess_messages_with_speakers method, speaker attribution with angle brackets)
- backend/participants_config.json (updated system prompts with attribution format instructions)
- backend/adapter.py (client_ready event signal, track connected clients with logging)
- backend/main.py (wait for SSE client ready before starting conversation, 5s timeout)
- frontend/app/page.tsx (connect to SSE before startConversation)
- backend/participants.py (Gemini system_instruction parameter, return system_prompt tuple)
- backend/storage.py (filename field for analytics, filter empty messages)
- STATUS.md (message attribution complete)

**Modified (2025-09-30):**
- backend/conversation_graph.py (conversation ID tracking, snapshot method)
- backend/main.py (conversation ID in responses, snapshot endpoint)
- frontend/app/page.tsx (URL-based persistence, reconnection logic)
- frontend/app/hooks/useConversationApi.ts (snapshot fetching)
- frontend/app/hooks/useAISDKAdapter.ts (restoreMessages method)
- frontend/app/analytics/page.tsx (ongoing conversation display)

## Known Issues

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