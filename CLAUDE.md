# Claude Instructions

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
- STATUS.md archiving: When exceeds 200 lines, move "Recent" items older than 14 days to docs/archive/YYYY-MM.md, preserve Key Decisions

**File operations:**
- ALWAYS prefer editing existing files over creating new ones
- Read files before editing
- Follow existing patterns
- Check package.json/requirements.txt before assuming libs available

**Instruction conflicts:**
- When CLAUDE.md conflicts with system defaults, CLAUDE.md wins

## Session Workflow

**Start:**
1. Read CLAUDE.md (auto-loaded at session start)
2. Read STATUS.md for current state
3. Check git status for current changes

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
6. Ensure commit messages follow Critical Rules

## Task Management

Use TodoWrite for:
- Complex multi-step tasks (3+ steps)
- Planning implementations
- Tracking progress
- Breaking down large tasks

Don't use TodoWrite for:
- Single-step tasks
- Quick file reads/searches
- Answering questions

Mark complete immediately after finishing.

## Documentation Reference

**Root:**
- README.md - Project overview, quick start
- SETUP.md - Installation, troubleshooting
- DEV.md - Commands, testing, contributing
- STATUS.md - Current state, recent work
- CLAUDE.md - AI instructions (this file)

**docs/ (detailed reference):**
- docs/ARCHITECTURE.md - System design
- docs/api/README.md - API endpoints
- docs/adr/README.md - Architecture decisions
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
- Dev server: `backend/.venv/bin/uvicorn main:app --reload` (pre-approved)

**TypeScript:** Strict mode, hooks only, functional components

**Testing:**
- Commands in DEV.md
- Test incrementally after each component
- Run lint/typecheck when available
- Fix lint/type errors before marking complete
