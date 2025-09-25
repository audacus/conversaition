# AI Agent Instructions for Conversaition Project

**Purpose:** This file contains instructions for AI tools working on the Conversaition project to maintain consistent, up-to-date project state across sessions.

## 📋 Core Responsibilities for AI Agents

### 1. **ALWAYS Update PROGRESS.md**
Every AI agent working on this project MUST update `PROGRESS.md` with:
- **Current Status Section** (at top) - What phase/day/task is currently being worked on
- **Recent Decisions** - Architectural choices, implementation approaches, trade-offs
- **Current Implementation Status** - Checklist of completed/pending tasks
- **Next Steps** - Clear actions for next session
- **Blockers/Issues** - Any problems encountered
- **Quick Start Instructions** - How to resume work immediately

### 2. **Information Architecture Maintenance**
```
README.md           - Complete project vision, requirements, full architecture
MVP.md             - Focused MVP scope, 2-3 day implementation plan
PROGRESS.md        - LIVING DOCUMENT - current status, always up-to-date
AGENT.md           - This file - instructions for AI agents + coding standards
.env.example       - Environment variable templates for API keys
docs/adr/          - Architecture Decision Records (major technical choices)
```

### 3. **Session Workflow for AI Agents**
1. **Read project state:** README.md → MVP.md → PROGRESS.md → current code
2. **Update PROGRESS.md** with session start status
3. **Work on tasks** with frequent PROGRESS.md updates
4. **End session** by updating PROGRESS.md with current status and next steps

## 🎯 Project References

**For current project status, phase, and implementation details:**
- Read **PROGRESS.md** for current status and active tasks
- Read **MVP.md** for implementation scope and technical architecture
- Read **README.md** for complete project vision and requirements

## 🛠️ Implementation Guidelines

### Implementation Guidelines

- **Follow PATTERNS.md** for coding conventions and architectural patterns
- **Document major decisions** in docs/adr/ using the ADR template
- **Use .env.example** as template for environment setup
- **Track current progress** in PROGRESS.md (not here)
- **Maintain MVP scope** as defined in MVP.md
- **Test incrementally** after each component implementation

### Implementation References

**For coding patterns and templates:**
- See **docs/adr/001** for SSE/AI SDK integration patterns
- See **MVP.md** for AI participant configurations and environment setup
- See **docs/adr/** for architectural decisions and LangGraph patterns

## 📝 Documentation Standards

### PROGRESS.md Structure
Follow the established template in PROGRESS.md. Key sections to always update:
- **Current Status** - What phase/task is being worked on
- **Recently Completed** - Tasks finished this session with timestamps
- **Currently Working On** - Active task with details
- **Next Steps** - Clear actions for continuation
- **Recent Decisions & Ideas** - Architectural choices and rationale
- **File Changes This Session** - Track all modifications

### Architecture Decision Records (ADR)
For major technical decisions, create ADR files in `docs/adr/` using this format:
```
# [Number] - [Title]
**Date:** YYYY-MM-DD
**Status:** [Proposed|Accepted|Deprecated|Superseded]

## Context
What situation led to this decision?

## Decision
What is the change we're proposing or have agreed to implement?

## Consequences
What becomes easier or more difficult to do because of this change?
```

## 🚦 Decision-Making Guidelines

### When to Update PROGRESS.md
- **Start of session** - Current status and plan
- **After completing tasks** - Mark progress and note decisions
- **When encountering issues** - Document problems and approaches tried
- **End of session** - Summary and next steps

### Architecture Decision Documentation
Always document in PROGRESS.md:
- **Why** a particular approach was chosen
- **Alternatives** considered
- **Trade-offs** identified
- **Future implications** of the decision

### Code Organization Principles
- **Prefer editing existing files** over creating new ones
- **Follow existing patterns** in the codebase
- **Keep MVP scope focused** - don't add features beyond MVP.md definition
- **Test incrementally** - validate each component as it's built

## 📁 File Organization Standards

### Backend Structure
```
backend/
├── main.py              # FastAPI app with SSE endpoints
├── participants.py      # AI participant configurations
├── conversation_graph.py # LangGraph multi-agent setup
├── adapter.py          # LangGraph → AI SDK event adapter
├── models.py           # Pydantic models and types
└── utils.py            # Shared utilities
```

### Frontend Structure
```
frontend/app/
├── page.tsx            # Main SSE streaming interface
├── components/
│   ├── StreamingView.tsx    # AI SDK streaming components
│   ├── EventDisplay.tsx     # Display streaming events
│   └── ConnectionStatus.tsx # SSE connection indicator
├── hooks/
│   ├── useSSEStream.ts      # Custom SSE + AI SDK hook
│   └── useAISDKAdapter.ts   # AI SDK integration hook
└── types/
    ├── ai-sdk.ts           # AI SDK event types
    └── sse.ts              # SSE-specific types
```

## 🚦 Code Quality Standards

### Git Commit Standards

**Commit Message Format:**
- Use short, concise one-line commit messages (50 characters or less)
- Use imperative mood (e.g., "Add LangGraph dependencies" not "Added LangGraph dependencies")
- Focus on what the commit does, not what was done
- Examples: "Add participants config", "Fix SSE streaming", "Update conversation graph"

### Required Tools
- **Python**: `black` formatting, `flake8` linting, `mypy` type checking
- **TypeScript**: `prettier` formatting, `eslint` linting, built-in type checking

### Pre-commit Requirements
- All code must pass formatting and linting checks
- Type errors must be resolved before commits
- Test files should follow same quality standards

### Performance Guidelines
- Use async/await for all I/O operations
- Implement proper error boundaries in React components
- Cache AI provider instances to avoid recreation
- Use connection pooling for database connections (when implemented)

## 🔒 Security Best Practices

### API Key Management
- **Never log API keys** or other sensitive data
- Use environment variables for all secrets
- Validate `.env` file exists before starting services
- Use `.env.example` as template for required variables

### Input Validation
- Validate all user inputs on backend
- Sanitize conversation content before processing
- Use Pydantic models for request/response validation
- Implement proper CORS settings

### Error Handling
- Never expose internal errors to client
- Log detailed errors server-side only
- Use structured error responses
- Implement proper HTTP status codes

## 🎯 Success Metrics for AI Agents

### Session Success Criteria
- [ ] PROGRESS.md accurately reflects current state
- [ ] Next AI agent can resume work immediately
- [ ] All architectural decisions are documented
- [ ] Code changes align with MVP.md scope
- [ ] Implementation follows established patterns

**For MVP and technical success criteria, see MVP.md**

## 🔄 Handoff Protocol

### When Ending a Session
1. **Update PROGRESS.md** with current status
2. **Document any blockers** clearly
3. **List next 3 concrete actions**
4. **Note any environment setup** needed
5. **Commit/save all work** appropriately

### When Starting a Session
1. **Read PROGRESS.md first** to understand current state
2. **Validate environment setup** (backend/frontend running)
3. **Review recent decisions** and implementation approach
4. **Update PROGRESS.md** with session start
5. **Pick up from documented next steps**

---

**Last Updated:** September 25, 2025
**Version:** 1.0
**Purpose:** Ensure seamless AI agent collaboration on Conversaition project