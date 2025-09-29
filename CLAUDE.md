# Conversaition AI Agent Instructions

## Project Context
You're working on **Conversaition** - a multi-AI conversation platform with human oversight. The MVP is complete and performance-optimized. Current status: enterprise-ready platform with 3 AI participants (Alice, Bob, Charlie) using latest AI models.

**For project structure and static information, see AGENTS.md**

## Critical Git Standards
**NEVER mention Claude Code, "Generated with", or any AI attribution in commit messages.**

Required format:
- Short, imperative messages (128 chars max)
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
Create ADR files in `docs/adr/` for major technical decisions. See `docs/adr/README.md` for current ADRs and template format.

### Implementation Plans
Document new features in `docs/plans/` before implementation. See `docs/plans/README.md` for active plans and template format.

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

## Session Workflow Protocol
**Every session must follow this pattern:**

### Session Start:
1. **Read PROGRESS.md first** - understand current state
2. **Validate environment setup** (backend/frontend running if needed)
3. **Review recent decisions** and implementation approach
4. **Update PROGRESS.md** with session start status
5. **Pick up from documented next steps**

### During Work:
- **Update PROGRESS.md frequently** - after completing tasks
- **Document blockers/issues** as they arise
- **Note architectural decisions** and rationale

### Session End:
1. **Update PROGRESS.md** with current status
2. **Document any blockers** clearly
3. **List next 3 concrete actions** for continuation
4. **Note environment setup needs**
5. **Add file changes section** to PROGRESS.md
6. **Create git commits** - separate commits by concern (accessibility, tests, docs, etc.)
   - Use short, imperative messages (follow Git Standards above)
   - Stay in project folder - no `cd ..`
   - One logical change per commit

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

## Documentation Structure

### Root Documentation
- **README.md** - Project overview, quick start, features (133 lines)
- **GETTING_STARTED.md** - Installation, environment setup, troubleshooting
- **DEVELOPMENT.md** - Development commands, testing, workflow
- **ARCHITECTURE.md** - System design, components, tech stack, roadmap
- **PROGRESS.md** - Current status, recent work, next actions, session notes
- **AGENTS.md** - Project structure and conventions (static reference)
- **CLAUDE.md** - This file - AI agent instructions

### docs/ Directory
- **docs/README.md** - Documentation hub and navigation
- **docs/adr/README.md** - Architecture Decision Records index
- **docs/api/README.md** - Complete API endpoint documentation
- **docs/plans/README.md** - Implementation plans and feature specs
- **docs/archive/** - Historical documents and archived plans

### Quick Reference
- Setup issues → GETTING_STARTED.md
- Running commands → DEVELOPMENT.md
- System design → ARCHITECTURE.md
- Current work → PROGRESS.md
- API details → docs/api/README.md
- Design decisions → docs/adr/README.md