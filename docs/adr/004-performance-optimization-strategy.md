# 004 - Performance Optimization Strategy

**Date:** 2025-09-26
**Status:** Accepted

## Context

After MVP completion, the frontend was experiencing UI lag due to 2-second polling intervals for conversation status updates. Users would experience delays between clicking actions (pause/resume) and seeing status changes reflected in the UI. This created a suboptimal user experience that felt sluggish and unresponsive.

The original implementation used HTTP polling every 2 seconds to check conversation status:

```typescript
// Original polling approach
useEffect(() => {
  const interval = setInterval(async () => {
    const status = await fetch('/conversation/status');
    setConversationStatus(status);
  }, 2000); // 2-second lag for all status updates
}, []);
```

Alternative approaches considered:
1. Reduce polling interval to 500ms (increases server load)
2. Implement WebSocket bidirectional communication (more complex)
3. Extend existing SSE stream with status events (chosen approach)

## Decision

We will implement **Event-Driven Status Updates** by extending the existing Server-Sent Events (SSE) stream to include conversation status changes. This eliminates polling lag and provides instant UI responsiveness.

### Implementation Strategy:

#### Backend SSE Extension:
```python
# Enhanced adapter.py - Add status events to SSE stream
async def broadcast_conversation_status(self, status: str):
    """Broadcast status changes via existing SSE connections"""
    status_event = {
        "type": "conversation_status",
        "data": {
            "status": status,
            "timestamp": datetime.utcnow().isoformat()
        }
    }

    # Send to all active SSE connections
    for connection in self.active_connections:
        await connection.send(status_event)
```

#### Frontend Event-Driven Updates:
```typescript
// Enhanced useSSEStream.ts - Handle status events
const handleSSEMessage = (event: MessageEvent) => {
  const data = JSON.parse(event.data);

  if (data.type === 'conversation_status') {
    // Dispatch custom event for instant UI updates
    window.dispatchEvent(new CustomEvent('conversationStatusChange', {
      detail: { status: data.data.status }
    }));
  }
  // ... handle other event types
};
```

### Key Changes:
- **Remove Polling**: Eliminate all setTimeout/setInterval for status checks
- **SSE Integration**: Leverage existing SSE infrastructure for status updates
- **Real-time Events**: Instant status propagation to UI components
- **Backward Compatibility**: Maintain existing API endpoints for direct queries

## Consequences

### Benefits
- **Instant UI Responsiveness**: Status changes reflected immediately (< 100ms)
- **Reduced Server Load**: Eliminates repetitive polling HTTP requests
- **Better User Experience**: Smooth, responsive interface interaction
- **Leverages Existing Infrastructure**: Uses established SSE streaming system
- **Scalable Pattern**: Event-driven architecture supports future real-time features

### Technical Improvements
- **Network Efficiency**: Single SSE connection vs multiple HTTP polls
- **Battery Life**: Reduced network activity on mobile devices
- **Resource Usage**: Lower CPU/memory consumption from eliminated timers
- **Error Handling**: SSE reconnection handles temporary network issues

### Implementation Requirements
- Ensure all conversation state changes emit status events
- Handle SSE connection drops gracefully with automatic reconnection
- Maintain data format consistency between polling and event-driven approaches
- Test thoroughly across different browsers and network conditions

### Future Extensions
- Real-time participant typing indicators
- Live conversation analytics updates
- Instant notification system for multi-user features
- Advanced error state broadcasting

## Implementation Patterns

### Status Event Broadcasting Pattern
```python
# Consistent status event emission
class ConversationManager:
    async def start_conversation(self, topic: str):
        # ... conversation logic
        await self.broadcast_status("active")

    async def pause_conversation(self):
        # ... pause logic
        await self.broadcast_status("paused")

    async def broadcast_status(self, status: str):
        event = {
            "type": "conversation_status",
            "data": {"status": status}
        }
        await self.sse_manager.broadcast_to_all(event)
```

### Frontend Event Handling Pattern
```typescript
// Reactive status updates
const useConversationStatus = () => {
  const [status, setStatus] = useState<string>('idle');

  useEffect(() => {
    const handleStatusChange = (event: CustomEvent) => {
      setStatus(event.detail.status);
    };

    window.addEventListener('conversationStatusChange', handleStatusChange);
    return () => window.removeEventListener('conversationStatusChange', handleStatusChange);
  }, []);

  return status;
};
```

## Related Decisions
- [001] LangGraph to AI SDK Adapter Architecture - SSE infrastructure foundation
- [002] LangGraph Multi-Agent Conversation Patterns - Status integration points
- [003] MVP-First Architecture Strategy - Performance optimization priority
- Real-time multi-user features (future ADR)