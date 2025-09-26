# Conversaition Project Memory

## Project Context
You're working on **Conversaition** - a multi-AI conversation platform with human oversight. The MVP is complete and performance-optimized. Current status: enterprise-ready platform with 3 AI participants (Alice, Bob, Charlie) using latest AI models.

Key files: `PROGRESS.md` (living document), `AGENTS.md` (human instructions), `MVP.md` (implementation scope), `README.md` (full vision).

## Critical Git Standards
**NEVER mention Claude Code, "Generated with", or any AI attribution in commit messages.**

Required format:
- Short, imperative messages (80 chars max)
- Examples: "Add participants config", "Fix SSE streaming", "Update conversation graph"
- Focus on what the commit does, not what was done

## Documentation Requirements

### PROGRESS.md Updates (Critical)
**Always update PROGRESS.md** for every significant task:
- Update "Current Status" section at top
- Log "Recently Completed" with timestamps
- Document "File Changes This Session"
- Add "Recent Decisions & Ideas" for architectural choices
- Update "Next Steps" for future work

### Architecture Decision Records
Create ADR files in `docs/adr/` for major technical decisions:
```
# [Number] - [Title]
**Date:** YYYY-MM-DD
**Status:** [Proposed|Accepted|Deprecated]

## Context / ## Decision / ## Consequences
```

## Code Quality Standards

### File Editing Strategy
- **ALWAYS prefer editing existing files** over creating new ones
- Read files before editing to understand current structure
- Follow existing code patterns and conventions
- Check package.json/requirements.txt before assuming libraries are available

### Testing and Validation
- Test incrementally after each component implementation
- Run lint/typecheck commands when available
- Validate changes work before marking tasks complete

## Task Management
Use TodoWrite tool proactively for:
- Complex multi-step tasks (3+ steps)
- Planning implementation approaches
- Tracking progress during development
- Breaking down large tasks into smaller steps

Mark todos complete immediately after finishing tasks.

## Communication Standards
- Keep responses concise (fewer than 4 lines unless detail requested)
- Answer directly without unnecessary preamble
- Focus on the specific task at hand
- Use TodoWrite to demonstrate progress tracking

## Project Architecture Notes
- Backend: FastAPI + LangGraph + in-memory state (MVP)
- Frontend: Next.js + TypeScript + AI SDK
- AI Models: gpt-4.1-mini, claude-sonnet-4-20250514, gemini-2.5-flash
- Future: Database migration path planned (PostgreSQL + Redis)