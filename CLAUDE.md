# Claude Instructions

## Project Context

**Conversaition** - Multi-AI conversation platform with human oversight.

**Tech:** FastAPI + LangGraph + Next.js + TypeScript + AI SDK

## Critical Rules

**Git commits:**
- NEVER mention Claude Code, AI tools, or "Generated with"
- Short imperative messages (128 chars max): "Add feature", "Fix bug"
- Focus on what commit does, not what was done

**Documentation updates:**
- Always update STATUS.md for significant tasks
- Use terse, human-readable format: bullets over prose
- Link, don't duplicate (single source of truth)
- No emoji except critical status (✅❌⚠️)
- STATUS.md: 5 bullets max per section

**File operations:**
- ALWAYS prefer editing existing files over creating new ones
- Read files before editing
- Follow existing patterns
- Check package.json/requirements.txt before assuming libs available

## Session Workflow

**Start:**
1. Read STATUS.md first
2. Validate environment if needed
3. Update STATUS.md with session start

**During:**
- Update STATUS.md frequently
- Document blockers as they arise
- Note architectural decisions

**End:**
1. Update STATUS.md with current state
2. Document blockers clearly
3. List 3 concrete next actions
4. Add file changes section
5. Create git commits (separate by concern, one logical change per commit)

## Task Management

Use TodoWrite for:
- Complex multi-step tasks (3+ steps)
- Planning implementations
- Tracking progress
- Breaking down large tasks

Mark complete immediately after finishing.

## Communication

- Concise responses (<4 lines unless detail requested)
- Answer directly without preamble
- Focus on specific task
- Use TodoWrite to show progress

## Documentation Reference

**Root:**
- README.md - Project overview, quick start
- SETUP.md - Installation, troubleshooting → Use for setup issues
- DEV.md - Commands, testing, contributing → Use for dev workflows
- STATUS.md - Current state, recent work → Use for current work
- CLAUDE.md - AI instructions (this file)

**docs/ (detailed reference):**
- docs/ARCHITECTURE.md - System design → Use for system design questions
- docs/api/README.md - API endpoints → Use for API details
- docs/adr/README.md - Architecture decisions → Use for design decisions
- docs/plans/README.md - Implementation plans

## Project Structure

```
backend/
├── main.py                   # FastAPI + endpoints
├── conversation_graph.py     # LangGraph orchestration
├── participants.py           # CRUD + validation
├── adapter.py               # SSE streaming
├── storage.py               # Transcript persistence
└── participants_config.json # AI configs

frontend/app/
├── page.tsx                 # Main UI
├── participants/            # Management UI
├── hooks/                   # React hooks (useSSEStream, useAISDKAdapter)
└── tests/                   # Playwright E2E
```

## Key Standards

**Python:**
- PEP 8, type hints, async/await, docstrings
- Always use `backend/.venv/bin/python` directly (NOT `source .venv/bin/activate && python`)
- Virtual environment is in `backend/.venv/`

**TypeScript:** Strict mode, hooks only, functional components

**Testing:**
- Test incrementally after each component
- Run lint/typecheck when available
- Validate changes before marking complete

**Terseness principle:**
Write docs like human notes: terse bullets, short statements, no unnecessary prose. AI reads/writes fast; humans don't. Save tokens, increase clarity.
