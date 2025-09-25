# 002 - LangGraph Multi-Agent Conversation Patterns

**Date:** 2025-09-25
**Status:** Accepted

## Context

The Conversaition project requires orchestrating multiple AI participants in a structured conversation flow. We need to define how multiple AIs will:
- Take turns speaking without interrupting each other
- Maintain shared conversation context
- Handle human intervention (pause/resume/inject messages)
- Schedule participants fairly using round-robin or weighted algorithms

LangGraph provides state management and conditional flows but we need to establish specific patterns for multi-participant conversations.

## Decision

We will implement standardized LangGraph patterns for multi-agent conversations:

### 1. Conversation State Pattern
```python
from langgraph.graph import StateGraph
from typing import TypedDict, Annotated
import operator

class ConversationState(TypedDict):
    messages: Annotated[list, operator.add]  # Append-only message history
    current_speaker: str                     # Active participant ID
    participants: dict                       # Participant configurations
    conversation_active: bool                # Conversation state flag
    human_input_pending: bool               # Waiting for human input
    turn_count: int                         # Track conversation progress
```

### 2. Multi-Agent Graph Structure
```python
def build_conversation_graph():
    graph = StateGraph(ConversationState)

    # Core conversation nodes
    graph.add_node("scheduler", determine_next_speaker)
    graph.add_node("ai_response", process_ai_response)
    graph.add_node("human_input", handle_human_input)
    graph.add_node("broadcaster", broadcast_message)

    # Flow control
    graph.add_conditional_edges("scheduler", route_next_action)
    graph.add_edge("ai_response", "broadcaster")
    graph.add_edge("human_input", "broadcaster")

    # Return to scheduler for next turn
    graph.add_edge("broadcaster", "scheduler")

    return graph.compile()
```

### 3. Turn Management Pattern
```python
def determine_next_speaker(state: ConversationState) -> dict:
    """Determine next AI participant using round-robin scheduling"""
    if state["human_input_pending"]:
        return {"current_speaker": "human"}

    participants = list(state["participants"].keys())
    current_index = participants.index(state.get("current_speaker", participants[0]))
    next_index = (current_index + 1) % len(participants)

    return {
        "current_speaker": participants[next_index],
        "turn_count": state.get("turn_count", 0) + 1
    }

def route_next_action(state: ConversationState) -> str:
    """Route to appropriate handler based on conversation state"""
    if not state["conversation_active"]:
        return "END"
    elif state["human_input_pending"]:
        return "human_input"
    else:
        return "ai_response"
```

### 4. AI Response Processing Pattern
```python
async def process_ai_response(state: ConversationState) -> dict:
    """Process AI response with streaming events"""
    current_speaker = state["current_speaker"]
    participant_config = state["participants"][current_speaker]

    # Initialize AI provider
    llm = get_ai_provider(participant_config)

    # Build conversation context
    messages = build_message_context(state["messages"], current_speaker)

    # Stream response with events
    response_content = ""
    async for chunk in llm.astream(messages):
        # Emit streaming events for SSE
        yield {
            "event": "on_chat_model_stream",
            "participant": current_speaker,
            "data": {"chunk": {"content": chunk.content}}
        }
        response_content += chunk.content

    # Add completed message to state
    new_message = {
        "id": generate_message_id(),
        "participant": current_speaker,
        "content": response_content,
        "timestamp": datetime.utcnow().isoformat()
    }

    return {"messages": [new_message]}
```

## Consequences

### Benefits
- **Structured turn management:** Clear scheduling prevents AI interruptions
- **Flexible state handling:** Easy to add pause/resume and human input
- **Event-driven streaming:** Natural integration with SSE and AI SDK adapter
- **Extensible pattern:** Can easily add weighted scheduling, branching, tools

### Implementation Requirements
- All conversation nodes must handle state immutably
- Event emission must be consistent for adapter conversion
- Error handling must preserve conversation state
- Human intervention must not break conversation flow

### Future Extensions
- Weighted round-robin scheduling based on participation history
- Conversation branching for exploring multiple topics
- Tool integration for code execution, web search, file analysis
- Dynamic participant addition/removal during conversations

## Related Decisions
- [001] LangGraph to AI SDK Adapter Architecture
- Multi-participant scheduling algorithms (future ADR)
- Conversation persistence and recovery (future ADR)