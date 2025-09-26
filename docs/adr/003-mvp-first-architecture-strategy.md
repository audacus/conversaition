# 003 - MVP-First Architecture Strategy

**Date:** 2025-09-26
**Status:** Accepted

## Context

The Conversaition project needed to balance rapid MVP validation with the comprehensive vision outlined in the README.md. The full vision includes PostgreSQL database persistence, Redis caching, multi-user support, and complex infrastructure. However, for MVP validation, we needed to prove the core multi-AI conversation concept quickly.

Alternative approaches considered:
1. Full implementation with database persistence from day 1
2. Mock/stub implementation without real AI integration
3. In-memory state with real AI integration (chosen approach)

## Decision

We will implement an **MVP-First Architecture Strategy** that prioritizes core functionality validation over comprehensive infrastructure:

### MVP Implementation Choices:
- **In-Memory State Management**: Conversation state stored in application memory instead of Redis/PostgreSQL
- **Single Conversation Instance**: One active conversation at a time vs multi-user sessions
- **Simple Round-Robin**: Basic turn management vs weighted scheduling algorithms
- **Core AI Integration**: Real OpenAI/Anthropic/Gemini integration without advanced features
- **Essential API Endpoints**: Focus on conversation control (start/pause/resume/inject/status)

### Database Evolution Path:
```python
# Current MVP: In-memory state
conversation_state = {
    "messages": [],
    "participants": {},
    "current_speaker": "Alice",
    "conversation_active": True
}

# Future: Database persistence
# PostgreSQL for conversations, participants, messages
# Redis for session management, real-time state
```

## Consequences

### Benefits
- **Rapid Validation**: 2-3 day implementation vs 2-3 month full stack
- **Core Concept Proof**: Validates multi-AI conversation viability
- **Real AI Integration**: Uses actual AI providers for authentic testing
- **Simple Deployment**: No database setup required for MVP testing
- **Clear Migration Path**: Architecture designed for database evolution

### Trade-offs
- **Session Persistence**: Conversations lost on application restart
- **Single User**: Cannot handle multiple concurrent conversations
- **Memory Limitations**: Not suitable for long-running production use
- **Stateful Application**: Requires sticky sessions for scaling

### Migration Requirements
- Implement database models (Conversation, Participant, Message)
- Add Redis session management for multi-user support
- Convert in-memory state to database queries
- Add authentication and user management
- Implement proper error recovery and state synchronization

## Implementation Patterns

### Current MVP State Management
```python
# Simple in-memory state
class ConversationManager:
    def __init__(self):
        self.state = ConversationState()

    async def update_state(self, updates: dict):
        # Direct memory updates
        self.state.update(updates)
```

### Future Database Integration
```python
# Database-backed state management
class ConversationManager:
    def __init__(self, db_session, redis_client):
        self.db = db_session
        self.redis = redis_client

    async def update_state(self, conversation_id: str, updates: dict):
        # Persist to database + cache in Redis
        await self.db.execute(update_query)
        await self.redis.hset(f"conv:{conversation_id}", updates)
```

## Related Decisions
- [001] LangGraph to AI SDK Adapter Architecture
- [002] LangGraph Multi-Agent Conversation Patterns
- [004] Performance Optimization Strategy (future ADR)
- Database migration strategy (future ADR)