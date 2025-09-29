# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) documenting key technical decisions made during the development of Conversaition.

## What are ADRs?

ADRs are documents that capture important architectural decisions along with their context and consequences. They help teams understand why certain technical choices were made and serve as historical records of the project's evolution.

## ADR Format

Each ADR follows this structure:
- **Title**: Short descriptive name
- **Date**: When the decision was made
- **Status**: Proposed, Accepted, Deprecated, or Superseded
- **Context**: The issue motivating this decision
- **Decision**: What was decided
- **Consequences**: Results of this decision (positive, negative, neutral)

## Active ADRs

### Core Architecture

#### [001 - LangGraph AI SDK Adapter](001-langgraph-ai-sdk-adapter.md)
**Date**: 2025-09-25 | **Status**: Accepted

Custom adapter to bridge LangGraph events with Vercel AI SDK stream protocol. Enables real-time streaming of multi-agent conversations to React frontend.

**Key Decision**: Implement custom event conversion layer rather than using off-the-shelf solutions.

---

#### [002 - LangGraph Multi-Agent Patterns](002-langgraph-multi-agent-patterns.md)
**Date**: 2025-09-25 | **Status**: Accepted

Multi-agent conversation orchestration using LangGraph with pause/resume capabilities and conditional routing.

**Key Decision**: Use LangGraph's native graph primitives for conversation flow control.

---

#### [003 - MVP-First Architecture Strategy](003-mvp-first-architecture-strategy.md)
**Date**: 2025-09-26 | **Status**: Accepted

Focus on building a working MVP with 3 AI participants before implementing advanced features like Redis, PostgreSQL, or branching.

**Key Decision**: In-memory state management for MVP, database integration deferred to later phases.

---

### Performance & Optimization

#### [004 - Performance Optimization Strategy](004-performance-optimization-strategy.md)
**Date**: 2025-09-27 | **Status**: Accepted

Event-driven status updates replacing 2-second polling, improved SSE connection management, and eliminated redundant state checks.

**Key Decision**: Broadcast status changes via SSE events instead of client-side polling.

---

### Data Models

#### [005 - Simplified Participant Model](005-simplified-participant-model.md)
**Date**: 2025-09-28 | **Status**: Accepted

External JSON configuration file for participants instead of database tables. Enables adding/removing AI participants without code changes.

**Key Decision**: File-based participant configuration (`participants_config.json`) with in-memory caching.

---

### AI Integration

#### [006 - AI Model Selection Strategy](006-ai-model-selection-strategy.md)
**Date**: 2025-09-28 | **Status**: Accepted

Selected latest generation AI models: `gpt-4.1-mini`, `claude-sonnet-4-20250514`, `gemini-2.5-flash` for optimal performance and cost efficiency.

**Key Decision**: Use latest available models from each provider for competitive multi-AI conversations.

---

## ADR Index by Status

### Accepted (6)
All current ADRs are in active use and form the foundation of the system architecture.

### Deprecated (0)
No deprecated decisions currently.

### Superseded (0)
No superseded decisions currently.

## ADR Index by Category

### Architecture & Design
- 001 - LangGraph AI SDK Adapter
- 002 - LangGraph Multi-Agent Patterns
- 003 - MVP-First Architecture Strategy

### Performance
- 004 - Performance Optimization Strategy

### Data Management
- 005 - Simplified Participant Model

### AI & ML
- 006 - AI Model Selection Strategy

## Creating New ADRs

When making significant architectural decisions, create a new ADR:

1. **Number**: Use next sequential number (e.g., `007-decision-title.md`)
2. **Template**:
```markdown
# [Number] - [Title]

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult to do because of this change?

### Positive
- Benefit 1
- Benefit 2

### Negative
- Tradeoff 1
- Tradeoff 2

### Neutral
- Other change 1
```

3. **Update this README**: Add entry to the index above

## See Also

- [Architecture Overview](../../ARCHITECTURE.md) - Complete system architecture documentation
- [Implementation Plans](../plans/README.md) - Feature specifications and plans
- [API Reference](../api/README.md) - API endpoint documentation