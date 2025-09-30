# Conversaition Documentation Hub

Welcome to the Conversaition documentation! This hub provides access to all project documentation.

## Quick Navigation

### Getting Started
- **[Setup Guide](../SETUP.md)** - Installation, prerequisites, API keys, troubleshooting
- **[Development Guide](../DEV.md)** - Commands, testing, contributing
- **[Main README](../README.md)** - Project overview and quick start

### Architecture & Design
- **[Architecture Overview](ARCHITECTURE.md)** - System design, components, tech stack, roadmap
- **[Architecture Decision Records](adr/README.md)** - Historical design decisions
- **[API Reference](api/README.md)** - Complete API endpoint documentation

### Planning & Status
- **[Implementation Plans](plans/README.md)** - Feature specifications and plans
- **[Current Status](../STATUS.md)** - Current work, recent changes, next actions

### Project Guidance
- **[AI Agent Instructions](../CLAUDE.md)** - Development workflow and standards

## Documentation Structure

```
docs/
├── README.md              # This file - documentation hub
├── adr/                   # Architecture Decision Records
│   ├── README.md         # ADR index
│   └── *.md              # Individual ADRs
├── api/                   # API Documentation
│   └── README.md         # API reference
├── plans/                 # Implementation Plans
│   ├── README.md         # Plans index
│   └── *.md              # Individual plans
└── archive/               # Historical documentation
    └── *.md              # Archived plans and guides
```

## Key Topics

### Core Functionality
- Multi-AI conversation orchestration with LangGraph
- Real-time SSE streaming with AI SDK integration
- Participant management (CRUD operations)
- Conversation controls (start/pause/resume/stop)
- Human message injection

### Technical Stack
- **Backend**: Python 3.13, FastAPI, LangGraph, LangChain
- **Frontend**: Next.js 15, React, TypeScript, Vercel AI SDK
- **AI Providers**: OpenAI (GPT-4.1-mini), Anthropic (Claude Sonnet 4), Google (Gemini 2.5 Flash)
- **Infrastructure**: SSE streaming, transcript persistence

### Development Resources
- [Testing Guide](../DEV.md#testing) - Unit tests, E2E tests with Playwright
- [API Endpoints](api/README.md) - Full REST API documentation
- [Status Tracking](../STATUS.md) - Current status and next actions

## Contributing

For development workflow, git standards, and session protocols, see [CLAUDE.md](../CLAUDE.md).

## Need Help?

- Check [SETUP.md](../SETUP.md) for setup issues
- Review [STATUS.md](../STATUS.md) for known issues
- See [Architecture Decision Records](adr/README.md) for design rationale