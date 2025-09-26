# Conversaition Project Reference

**Purpose:** Static project information and structure reference for AI agents and developers. For behavioral instructions and workflows, see CLAUDE.md.

## 📊 Project Status
- **Current Phase:** MVP Complete + Performance Optimized
- **Architecture:** Multi-AI conversation platform with human oversight
- **AI Participants:** Alice (analytical), Bob (creative), Charlie (contrarian)
- **Technology Stack:** FastAPI + LangGraph + Next.js + TypeScript + AI SDK

## 📁 Information Architecture

### Core Documentation Files
```
README.md     - Complete project vision, requirements, full architecture
MVP.md        - Focused MVP scope, 2-3 day implementation plan
PROGRESS.md   - LIVING DOCUMENT - current status, always up-to-date
CLAUDE.md     - AI agent behavioral instructions and workflows
AGENTS.md     - This file - static project structure and reference
.env.example  - Environment variable templates for API keys
docs/adr/     - Architecture Decision Records (major technical choices)
```

### Project File Structure

#### Backend Structure
```
backend/
├── main.py              # FastAPI app with SSE endpoints
├── participants.py      # AI participant configurations
├── conversation_graph.py # LangGraph multi-agent setup
├── adapter.py          # LangGraph → AI SDK event adapter
├── models.py           # Pydantic models and types
└── utils.py            # Shared utilities
```

#### Frontend Structure
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

## 🏗️ Technical Architecture

### AI Models Configuration
- **Alice (OpenAI)**: `gpt-4.1-mini` - Analytical, fact-focused responses
- **Bob (Anthropic)**: `claude-sonnet-4-20250514` - Creative, empathetic responses
- **Charlie (Google)**: `gemini-2.5-flash` - Contrarian, thought-provoking responses

### Architecture Components
- **Backend:** FastAPI + LangGraph + in-memory state (MVP)
- **Frontend:** Next.js + TypeScript + AI SDK
- **Streaming:** Server-Sent Events (SSE) with custom LangGraph → AI SDK adapter
- **Turn Management:** Round-robin scheduling with human intervention support
- **Future Evolution:** Database migration path planned (PostgreSQL + Redis)

## 📋 Architecture Decision Records

### Current ADR Files
- **ADR 001:** LangGraph to AI SDK Adapter Architecture
- **ADR 002:** LangGraph Multi-Agent Conversation Patterns
- **ADR 003:** MVP-First Architecture Strategy
- **ADR 004:** Performance Optimization Strategy
- **ADR 005:** Simplified Participant Model
- **ADR 006:** AI Model Selection Strategy

### ADR Template Structure
```markdown
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

## 🎯 Success Metrics

### MVP Completion Criteria
- ✅ 3 AI participants with distinct personalities
- ✅ Real-time conversation streaming with turn management
- ✅ Human oversight capabilities (pause/resume/inject)
- ✅ Performance optimization (event-driven status updates)
- ✅ Enterprise-ready platform with proper error handling

### Technical Metrics
- Response latency < 3 seconds between AI turns
- Stream latency < 500ms for text chunks
- 100% correct speaker identification
- Connection stability during extended conversations

### Code Quality Standards
- **Python:** `black` formatting, `flake8` linting, `mypy` type checking
- **TypeScript:** `prettier` formatting, `eslint` linting, built-in type checking
- **Git:** Short, imperative commit messages (80 chars max)
- **Testing:** Incremental validation after each component implementation

## 🚀 Environment Setup Reference

### Development Environment
```bash
# Prerequisites: OpenAI, Anthropic, and Google API keys

# Backend setup
cd backend
source .venv/bin/activate
python main.py

# Frontend setup (separate terminal)
cd frontend
npm run dev
```

### API Endpoints
- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:3000
- **API Documentation:** http://localhost:8000/docs

---

**Last Updated:** September 26, 2025
**Version:** 2.0 - Separated behavioral instructions to CLAUDE.md
**Purpose:** Static project reference and structure documentation