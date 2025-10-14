# Frontend SSE Event Handling Investigation

## Date: 2025-10-13

## Issue Summary

Alice's first message consistently missing from conversation display, despite backend sending all events correctly.

## Root Cause Analysis

### 1. Initial Hypothesis (Incorrect)
- Thought `text-delta` was overwriting System message due to missing pendingMessageIdRef
- Added fallback logic, but this didn't solve the problem

### 2. React StrictMode Double-Invocation (Actual Root Cause)

**Discovery:** Console logs showed `text-start` being called TWICE for Alice:
```
[text-start] Creating new message for Alice, id=alice-abc
[text-start] Creating new message for Alice, id=alice-xyz
```

**Problem:** React StrictMode (development mode) double-invokes:
- Event handlers
- State updater functions
- Effects

**What Happens:**
1. First `text-start`: Creates message, sets `pendingMessageIdRef = alice-abc`
2. Second `text-start` (StrictMode): Creates SECOND message, OVERWRITES `pendingMessageIdRef = alice-xyz`
3. `text-delta` uses ref `alice-xyz` to update message
4. But first message `alice-abc` is what's visible, stays empty!

### 3. Attempted Fix #1: Guard Ref
Added `messageCreationGuardRef` to prevent duplicate message creation:
```typescript
const guardKey = `${participant}-${meta.turn}`;
if (messageCreationGuardRef.current.has(guardKey)) {
  return; // Block duplicate
}
```

**Result:** Successfully blocked duplicate, but Alice still missing!

### 4. Deeper Issue: Async State Updates

**New Discovery:** Even with guard, logs show:
```
[text-start] Creating new message for Alice, id=alice-123, turn=0
[text-delta] ref=alice-123, prev.length=1, delta.length=2  <-- Only System message!
[text-delta] ref=alice-123, prev.length=1, delta.length=9  <-- Still length=1!
...
[WARNING] Received text-done but no streaming message found
```

**Critical Finding:**
- `text-start` sets ref synchronously ✓
- `text-start` calls `setMessages` to add message
- `text-delta` arrives BEFORE state update completes
- `prev.length=1` means Alice's message isn't in array yet!
- Updates go nowhere, message stays empty

## The Fundamental Problem

**React state updates are asynchronous**, but SSE events arrive synchronously/rapidly:

```
Time 0ms:  text-start   -> setMessages([...prev, aliceMsg])  [queued]
Time 5ms:  text-delta   -> setMessages(prev => ...)           [prev doesn't have aliceMsg yet!]
Time 10ms: text-delta   -> setMessages(prev => ...)           [prev doesn't have aliceMsg yet!]
Time 15ms: [State update from text-start completes]
```

The message creation is queued but not yet in state when text-delta tries to update it.

## Why Subsequent Messages Work

- Bob/Charlie work because Alice's `text-done` has completed by the time their `text-start` arrives
- First message has no delay buffer
- StrictMode makes it worse by double-invoking everything

## Solution Requirements

1. Must work with React StrictMode (double invocation)
2. Must handle async state updates
3. Must handle rapid SSE event arrival
4. No race conditions

## Proposed Solutions

### Option A: Lazy Message Creation in text-delta
Instead of creating in text-start, create on-demand in text-delta:

```typescript
case 'text-start': {
  // ONLY set the ref, don't create message yet
  pendingMessageIdRef.current = createMessageId();
  return;
}

case 'text-delta': {
  setMessages(prev => {
    // Find existing message OR create it if missing
    const existingMsg = prev.find(m => m.id === pendingMessageIdRef.current);

    if (!existingMsg) {
      // Message doesn't exist yet, create it now
      return [...prev, {
        id: pendingMessageIdRef.current,
        participant,
        content: delta,
        isStreaming: true,
        ...
      }];
    }

    // Update existing message
    return prev.map(m => m.id === activeId ? {...m, content: m.content + delta} : m);
  });
}
```

**Pros:**
- Idempotent - text-delta creates if needed
- No race condition - creation happens in same update as first delta
- Works with StrictMode

**Cons:**
- text-start becomes a no-op for message creation
- Slightly less clear flow

### Option B: useReducer with Batched Updates
Use reducer pattern for better update batching:

```typescript
const [state, dispatch] = useReducer(messagesReducer, initialState);

// Reducer ensures consistent state
function messagesReducer(state, action) {
  switch (action.type) {
    case 'TEXT_START':
      // Check if message already exists
      if (state.messages.find(m => m.participant === action.participant && m.isStreaming)) {
        return state; // Already exists
      }
      return {...state, messages: [...state.messages, newMsg]};

    case 'TEXT_DELTA':
      // Update message, create if missing
      ...
  }
}
```

**Pros:**
- More predictable state updates
- Better debugging
- Cleaner separation

**Cons:**
- Larger refactor
- More complex

### Option C: Pending Messages Ref Map
Maintain pending messages in a ref until text-done:

```typescript
const pendingMessagesRef = useRef(new Map());

case 'text-start': {
  const msg = {id, participant, content: '', ...};
  pendingMessagesRef.current.set(id, msg);
  pendingMessageIdRef.current = id;
}

case 'text-delta': {
  const pending = pendingMessagesRef.current.get(pendingMessageIdRef.current);
  if (pending) {
    pending.content += delta;
  }
}

case 'text-done': {
  const pending = pendingMessagesRef.current.get(pendingMessageIdRef.current);
  setMessages(prev => [...prev, pending]);
  pendingMessagesRef.current.delete(pendingMessageIdRef.current);
}
```

**Pros:**
- No async state issues during streaming
- Single state update at text-done
- Performance benefit (fewer re-renders)

**Cons:**
- No visible streaming effect until done
- Defeats purpose of streaming UI

## Recommendation

**Option A (Lazy Creation)** is the best balance:
- Minimal code changes
- Preserves streaming UX
- Solves race condition
- StrictMode compatible
- Idempotent by design

## Files to Modify

- `frontend/app/hooks/useAISDKAdapter.ts`
  - Refactor text-start handler (lines 183-215)
  - Update text-delta handler (lines 217-258)
  - Update text-done handler (lines 261-297)

## Test Plan

1. Start fresh conversation
2. Verify Alice's first message appears
3. Verify subsequent messages (Bob, Charlie) appear
4. Check console for warnings
5. Test with StrictMode enabled (default in dev)
6. Test rapid message arrival

## Test Results

**2025-10-13 22:04 UTC:**
✅ **First message works**: Alice's first turn displays correctly with lazy creation
❌ **Subsequent messages fail**: Alice's 2nd turn, Bob's 2nd turn missing

### Guard Key Problem Discovered

**Symptoms:**
```
[text-start] Blocked duplicate for Alice
[text-delta] ref=null, prev.length=3, participant=Alice
[WARNING] [text-delta] No pending message ref, skipping
```

**Root Cause:**
Guard uses `${participant}-${meta.turn}` but `meta.turn` state is stale:
- Turn 0: Alice speaks, guard key "Alice-0" added
- Turn 1: Bob speaks, guard key "Bob-1" added
- Turn 2: Alice speaks again, but meta.turn still shows 0
- StrictMode double-invokes text-start for Alice
- First invocation: Would set ref, but guard key "Alice-0" already exists!
- Guard blocks, ref never set
- text-delta arrives with ref=null

**Solution Options:**
1. Use turn from event data: `event.data.turn ?? meta.turn`
2. Clear guard on turn-complete: `messageCreationGuardRef.current.clear()`
3. Use timestamp-based guard: `${participant}-${Date.now()}`

**Selected:** Option 2 (clear on turn-complete) - simplest, preserves intent

**2025-10-14 08:57 UTC:**
✅ **All messages display correctly**: Tested 5+ turns with Alice, Bob, Charlie
✅ **Guard clearing works**: messageCreationGuardRef.current.clear() in turn-complete
✅ **No duplicate messages**: StrictMode double-invocation handled correctly
✅ **Lazy creation stable**: Messages created on first text-delta without race conditions

## Final Solution

**Implementation (useAISDKAdapter.ts:312):**
```typescript
case 'turn-complete': {
  setMeta(prev => ({
    ...prev,
    turn: event.data.turn ?? prev.turn,
  }));
  // Clear guard to allow next turn's messages
  messageCreationGuardRef.current.clear();
  break;
}
```

**Why this works:**
- Lazy message creation (text-delta) solves async state race condition
- Guard prevents StrictMode duplicate creation within same turn
- Clearing guard after turn completion resets for next participant
- Simple, predictable, no stale state issues

## References

- React docs on StrictMode: https://react.dev/reference/react/StrictMode
- State update batching: https://react.dev/learn/queueing-a-series-of-state-updates
- Issue first reported: 2025-10-13 conversation
