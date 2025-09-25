# Conversaition MVP - Multi-AI Conversation Proof of Concept

**Status:** Ready for Implementation
**Timeline:** 2-3 Days
**Goal:** Validate core concept of multiple AIs having meaningful conversations with human oversight

## 🎯 MVP Scope & Features

### Core Requirements (Must Have)
- **3 AI Participants** with distinct personalities and providers
- **Turn Management** - AIs wait for each other, no interruptions
- **Shared Context** - All AIs see all messages and can reference each other by name
- **Real-time Streaming** - Live conversation flow using existing SSE foundation
- **Human Oversight** - User can pause/resume and inject messages mid-conversation

### Success Criteria
✅ **Functional Test:** 3 AIs with different personalities debate a topic for 10+ exchanges
✅ **Context Awareness:** Each AI references previous speakers by name
✅ **Human Control:** User can pause mid-conversation and add input
✅ **Performance:** Real-time streaming works without lag
✅ **Engagement:** Conversation feels natural and engaging

## 🏗️ MVP Architecture Decisions

### AI Participants Configuration
```python
PARTICIPANTS = {
    "Alice": {
        "provider": "openai",
        "model": "gpt-4.1-mini",
        "system_prompt": """You are Alice, an analytical, fact-focused, and methodical thinker.

Your personality: Analytical, fact-focused, methodical approach to discussions

In conversations with other AI participants and humans:
- Always reference other participants by name when responding to their points
- Base your arguments on data, research, and logical reasoning
- Keep responses concise but thorough (2-4 sentences typical)"""
    },
    "Bob": {
        "provider": "anthropic",
        "model": "claude-sonnet-4-20250514",
        "system_prompt": """You are Bob, a creative, empathetic, and big-picture thinker.

Your personality: Creative, empathetic, big-picture thinker with focus on human impact

In conversations with other AI participants and humans:
- Always reference other participants by name when building on their ideas
- Consider the human impact and emotional dimensions of topics
- Keep responses warm but substantial (2-4 sentences typical)"""
    },
    "Charlie": {
        "provider": "gemini",
        "model": "gemini-2.5-flash",
        "system_prompt": """You are Charlie, a devil's advocate and contrarian thinker.

Your personality: Devil's advocate, contrarian, challenges assumptions and pushes for deeper thinking

In conversations with other AI participants and humans:
- Always reference other participants by name when challenging their points
- Question underlying assumptions and conventional wisdom
- Keep responses provocative but respectful (2-4 sentences typical)"""
    }
}
```

### Technical Architecture
```
┌─────────────────────────┐    ┌──────────────────────────┐
│   Next.js Frontend      │    │   FastAPI Backend        │
│   • Multi-participant   │◄──►│   • LangGraph Multi-Agent│
│   • SSE Stream Consumer │    │   • Custom AI SDK Adapter│
│   • Pause/Resume UI     │    │   • Turn Management      │
└─────────────────────────┘    └──────────────────────────┘
                                         │
                               ┌──────────────────────────┐
                               │   AI Providers           │
                               │   • OpenAI (Alice)       │
                               │   • Anthropic (Bob)      │
                               │   • Gemini (Charlie)     │
                               └──────────────────────────┘
```

### Key Architectural Choices
- **LangGraph over custom orchestration** - Handles complex multi-agent flows
- **SSE over WebSocket** - Simpler implementation, AI SDK compatible
- **Custom Adapter** - LangGraph events → AI SDK stream protocol
- **Round-Robin Scheduling** - Simple but effective turn management
- **Stateless backend** - No database needed for MVP, conversation state in memory

## 📋 Implementation Plan (2-3 Days)

### Day 1: Multi-Agent LangGraph Foundation
**Goal:** 3 AIs talking to each other with SSE streaming

**Tasks:**
- [ ] Add LangGraph dependencies (`langchain`, `langgraph`, `langchain-openai`, `langchain-anthropic`, `langchain-google-genai`)
- [ ] Create `participants.py` with 3 AI configurations
- [ ] Build `conversation_graph.py` with LangGraph multi-agent setup
- [ ] Extend existing `adapter.py` for LangGraph → AI SDK events
- [ ] Update SSE endpoint to use LangGraph instead of mock streaming
- [ ] **Test:** 3 AIs discuss "Should AI have creative rights?" for 5+ exchanges

### Day 2: Enhanced Conversation Control
**Goal:** Human-in-the-loop conversation management

**Tasks:**
- [ ] Add conversation state management (`conversation_state.py`)
- [ ] Implement pause/resume functionality in LangGraph
- [ ] Enable human message injection API endpoint
- [ ] Improve turn management logic (prevent AI self-responses)
- [ ] Update frontend with participant identification and controls
- [ ] **Test:** User moderates debate, injects questions mid-conversation

### Day 3: Polish & Validation
**Goal:** Robust, demonstrable MVP

**Tasks:**
- [ ] Error handling and connection recovery
- [ ] Basic conversation persistence (JSON file storage)
- [ ] UI improvements for multi-participant display
- [ ] Performance optimization and testing
- [ ] Documentation and demo preparation
- [ ] **Final Test:** 30-minute moderated AI debate with human participation

## 🛠️ Technical Implementation Details

### LangGraph Conversation Flow
```python
class ConversationState(TypedDict):
    messages: List[dict]
    current_speaker: str
    participants: dict
    conversation_active: bool
    human_input_pending: bool

def build_conversation_graph():
    graph = StateGraph(ConversationState)

    # Core nodes
    graph.add_node("scheduler", determine_next_speaker)
    graph.add_node("ai_response", process_ai_response)
    graph.add_node("human_input", handle_human_input)
    graph.add_node("broadcaster", broadcast_message)

    # Flow control
    graph.add_conditional_edges("scheduler", route_next_action)
    return graph.compile()
```

### Event Streaming Integration
```python
class LangGraphToAISDKAdapter:
    def convert_langgraph_event(self, event):
        if event["type"] == "on_chat_model_start":
            return {"type": "text-start", "data": {}}
        elif event["type"] == "on_chat_model_stream":
            return {"type": "text-delta", "data": {"textDelta": event["content"]}}
        # ... additional mappings
```

## 🎯 Demo Scenarios

### Primary Demo: "The Ethics of AI Creativity"
**Setup:** Alice (analytical), Bob (creative), Charlie (contrarian)
**Topic:** "Should AI-generated art be eligible for copyright protection?"
**Flow:**
1. User starts conversation with topic
2. Alice presents factual analysis
3. Bob explores creative implications
4. Charlie challenges both perspectives
5. User injects follow-up question
6. Conversation continues for 10+ exchanges

### Secondary Demo: "Climate Change Solutions"
**Topic:** Practical approaches to addressing climate change
**Focus:** Show how different AI personalities approach same problem

## 📊 MVP Metrics & Validation

### Technical Metrics
- [ ] **Response Time:** < 3 seconds between AI turns
- [ ] **Stream Latency:** < 500ms for text chunks
- [ ] **Connection Stability:** No dropped connections during 30min test
- [ ] **Turn Accuracy:** 100% correct speaker identification

### Conversation Quality Metrics
- [ ] **Context Retention:** AIs reference previous speakers' points
- [ ] **Personality Consistency:** Each AI maintains distinct voice
- [ ] **Natural Flow:** Conversation feels organic, not robotic
- [ ] **Human Integration:** User inputs enhance rather than disrupt flow

## 🔄 Future Extensions (Post-MVP)

### Next Phase Candidates
- Weighted round-robin scheduling
- File upload and analysis
- Conversation branching
- Analytics dashboard
- Export functionality
- Multiple conversation templates

### Architecture Evolution
- Redis for multi-user state management
- PostgreSQL for conversation persistence
- Advanced LangGraph flows
- WebSocket upgrade for bi-directional communication

## 🚀 Getting Started

### Prerequisites
- API Keys: OpenAI, Anthropic, Google (Gemini)
- Current setup validated and working

### Environment Setup
```bash
# Backend dependencies
cd backend
source .venv/bin/activate
pip install langchain langgraph langchain-openai langchain-anthropic langchain-google-genai

# Set environment variables
export OPENAI_API_KEY="your-key"
export ANTHROPIC_API_KEY="your-key"
export GOOGLE_API_KEY="your-key"
```

### Implementation Start
Ready to begin Day 1 implementation with LangGraph multi-agent foundation.

---

**Last Updated:** September 25, 2025
**Next Action:** Begin Day 1 implementation