# 001 - LangGraph to AI SDK Adapter Architecture

**Date:** 2025-09-25
**Status:** Accepted

## Context

The Conversaition project needs to integrate LangGraph's multi-agent orchestration capabilities with Vercel's AI SDK for optimal frontend streaming. LangGraph provides excellent multi-agent conversation management but uses its own event system, while the AI SDK expects a specific stream protocol for seamless React integration.

Alternative approaches considered:
1. Direct WebSocket implementation with custom protocol
2. Using LangGraph events directly in frontend (bypassing AI SDK)
3. Creating a custom adapter to bridge LangGraph events → AI SDK protocol

## Decision

We will implement a custom **LangGraphToAISDKAdapter** that converts LangGraph's event stream into AI SDK compatible format. This adapter will:

- Map LangGraph events (`on_chat_model_start`, `on_chat_model_stream`, `on_chat_model_end`) to AI SDK events (`text-start`, `text-delta`, `text-done`)
- Handle tool execution events for future extensibility
- Add custom conversation events for multi-participant coordination
- Maintain SSE streaming for real-time experience

## Consequences

### Benefits
- **Best of both worlds:** Native LangGraph orchestration with AI SDK frontend integration
- **Proven technologies:** Both LangGraph and AI SDK are mature, well-documented
- **Full control:** Custom adapter allows tailoring event format for multi-participant needs
- **Future flexibility:** Easy to extend for branching, tools, analytics

### Trade-offs
- **Additional complexity:** Custom adapter requires development and maintenance
- **Event translation overhead:** Minimal performance cost for event conversion
- **Custom protocol:** Need to ensure compatibility as both libraries evolve

### Implementation Requirements
- Develop and test custom adapter thoroughly
- Document event mapping for future developers
- Provide fallback handling for unknown event types
- Monitor performance impact of event translation layer

## Implementation Patterns

### Adapter Implementation Pattern
```python
class LangGraphToAISDKAdapter:
    """Convert LangGraph events to AI SDK stream protocol"""

    def convert_event(self, langgraph_event: dict) -> dict:
        """Map LangGraph event to AI SDK format"""
        event_type = langgraph_event.get("event", "unknown")

        # Standard text streaming events
        if event_type == "on_chat_model_start":
            return {"type": "text-start", "data": {}}
        elif event_type == "on_chat_model_stream":
            return {
                "type": "text-delta",
                "data": {"textDelta": langgraph_event["data"]["chunk"]["content"]}
            }
        elif event_type == "on_chat_model_end":
            return {"type": "text-done", "data": {}}

        # Custom conversation events
        else:
            return {
                "type": "conversation-event",
                "data": {
                    "eventType": event_type,
                    "participant": langgraph_event.get("participant"),
                    "data": langgraph_event.get("data", {})
                }
            }
```

### Backend SSE Implementation
```python
from fastapi import FastAPI
from sse_starlette.sse import EventSourceResponse
import asyncio
import json

async def stream_conversation(conversation_id: str):
    """Stream conversation events via SSE"""
    queue = asyncio.Queue()

    async def event_generator():
        try:
            while True:
                # Wait for events from conversation graph
                event = await queue.get()

                # Convert to AI SDK format
                ai_sdk_event = adapter.convert_event(event)

                yield {
                    "event": ai_sdk_event["type"],
                    "data": json.dumps(ai_sdk_event["data"])
                }
        except asyncio.CancelledError:
            # Cleanup on client disconnect
            logger.info(f"Client disconnected from conversation {conversation_id}")
            raise

    return EventSourceResponse(event_generator())
```

### Frontend AI SDK Integration
```typescript
// AI SDK compatible event types
export type AISDKEvent =
  | { type: 'text-start'; data: {} }
  | { type: 'text-delta'; data: { textDelta: string } }
  | { type: 'text-done'; data: {} }
  | { type: 'tool-call'; data: { toolCallId: string; toolName: string; args: any } }
  | { type: 'tool-result'; data: { toolCallId: string; result: any } }
  | { type: 'error'; data: { error: string; type?: string } }
  | { type: 'conversation-event'; data: { eventType: string; participant?: string; data: any } };

// Custom SSE + AI SDK hook
export function useSSEStream({ url, onEvent, onError }: SSEStreamOptions) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource(url);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent(data);
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    return () => es.close();
  }, [url]);

  return { isConnected };
}
```

## Related Decisions
- [002] LangGraph Multi-Agent Conversation Patterns
- Multi-participant conversation scheduling (future ADR)
- Frontend state management approach (future ADR)
- Database and persistence strategy (future ADR)