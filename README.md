# Conversaition

**Multi-AI conversation platform with human-in-the-loop guidance**

🎯 **Status:** MVP Complete + Enterprise-Ready

## What is this?

"Bringing multiple AIs to the table for a conversation (with a human in the loop)."

Conversaition orchestrates real-time discussions between multiple AI participants (OpenAI, Anthropic, Google) while maintaining human oversight. Watch AI agents debate, collaborate, or brainstorm while you pause, inject insights, and guide the conversation.

## Key Features

- **Multi-AI Orchestration** - OpenAI GPT, Anthropic Claude, Google Gemini working together
- **Real-Time SSE Streaming** - Live conversation updates with event-driven architecture
- **Human Control** - Pause, resume, and inject messages at any point
- **Participants Management** - Full CRUD UI for managing AI personalities and configurations
- **Conversation Controls** - Start/stop/pause/resume with transcript persistence
- **Performance Optimized** - Eliminated polling, instant UI responsiveness
- **Latest Models** - gpt-4.1-mini, claude-sonnet-4-20250514, gemini-2.5-flash

## Quick Start

**Prerequisites:** Python 3.13+, Node.js 18+, API keys for OpenAI/Anthropic/Google

```bash
# Terminal 1: Backend
cd backend
.venv/bin/python main.py  # http://localhost:8000

# Terminal 2: Frontend (new terminal)
cd frontend
npm run dev  # http://localhost:3000
```

Visit **http://localhost:3000** to start conversations!

**First time setup?** See [SETUP.md](SETUP.md) for detailed instructions.

## Current Implementation

### Completed Features ✅
- 3 AI Participants (Alice/analytical, Bob/creative, Charlie/contrarian)
- LangGraph multi-agent orchestration with pause/resume
- Real-time SSE streaming with AI SDK integration
- Participants management UI (create/edit/delete)
- Transcript persistence and analytics endpoints
- Human message injection during conversations
- Event-driven status updates (zero polling)
- End-to-end Playwright testing

### In Progress 🚧
- Analytics dashboard UI
- Conversation branching
- File upload/analysis with LlamaIndex

## Documentation

### Getting Started
- **[Setup Guide](SETUP.md)** - Installation, environment setup, troubleshooting
- **[Development Guide](DEV.md)** - Commands, testing, contributing

### Architecture & Design
- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design, tech stack, roadmap
- **[Architecture Decisions](docs/adr/README.md)** - ADR index and historical decisions
- **[API Reference](docs/api/README.md)** - Complete API endpoint documentation

### Guides & Plans
- **[Documentation Hub](docs/README.md)** - Full documentation navigation
- **[Implementation Plans](docs/plans/README.md)** - Feature plans and specifications

### Project Status
- **[STATUS.md](STATUS.md)** - Current status, recent work, next actions

## Vision & Roadmap

### Core Use Cases
- **Debate & Analysis** - Multiple AI perspectives on complex topics
- **Brainstorming** - Creative collaboration with diverse AI personalities
- **Code Review** - Different AI models analyzing code from various angles
- **Research** - Multi-agent information synthesis and fact-checking

### Advanced Features (Planned)
- **Conversation Templates** - Pre-defined scenarios (debate, brainstorming, etc.)
- **File Analysis** - Share and analyze documents collaboratively
- **Tool Integration** - Code execution, web search, fact-checking
- **Branching Conversations** - Explore parallel topic threads
- **Analytics Dashboard** - Participation metrics and conversation insights

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed roadmap and technical plans.

## Project Structure

```
conversaition/
├── backend/             # Python FastAPI + LangGraph
│   ├── main.py         # API server
│   ├── conversation_graph.py  # Multi-agent orchestration
│   ├── participants.py # AI participant management
│   └── participants_config.json  # AI configurations
├── frontend/            # Next.js + React + AI SDK
│   ├── app/            # Next.js app router
│   ├── tests/          # Playwright E2E tests
│   └── public/         # Static assets
└── docs/               # Documentation
    ├── adr/            # Architecture Decision Records
    ├── api/            # API documentation
    ├── guides/         # How-to guides
    └── plans/          # Implementation plans
```

## Technology Stack

**Backend:** Python 3.13, FastAPI, LangGraph, LangChain
**Frontend:** Next.js 15, React, TypeScript, Vercel AI SDK
**AI Providers:** OpenAI, Anthropic, Google Gemini
**Streaming:** Server-Sent Events (SSE)
**Testing:** Playwright, Python unittest

## Contributing

This is a personal project, but contributions and suggestions are welcome! Feel free to:
- Open issues for bugs or feature requests
- Submit pull requests for improvements
- Share your conversation use cases

## License

[Your License Here]

---

**Made with ❤️ and AI** - This project demonstrates the power of coordinated AI collaboration.