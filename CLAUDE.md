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
5. **Commit/save work** appropriately

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