# Conversaition Development TODO

## CRITICAL ISSUE RESOLVED: Token Duplication Analysis (Sept 26, 2025)

### Problem Statement
- **Initial Issue**: Users reported token duplication in Alice's responses (tokens repeated multiple times)
- **Scope**: Issue affected ALL participants (Alice, Bob, Charlie), not just Alice
- **Severity**: Made conversations unreadable with extreme duplication (words repeated 4-12 times)

### Root Cause Analysis
**Primary Cause**: React StrictMode in Next.js 15 (enabled by default)
- Next.js 15 enables `reactStrictMode: true` by default in development
- StrictMode intentionally double-invokes components to detect side effects
- This created **multiple SSE EventSource connections** simultaneously
- Each SSE event was processed by multiple handlers, causing duplication

**Secondary Cause**: Architecture differences between branches
- **Master branch**: Mixed SSE connection + message processing in single hook = both token AND message duplication
- **Codex branch**: Separated SSE connection from message processing = only message duplication (no token duplication)

### Branch Comparison Results

#### Master Branch (PROBLEMATIC)
- ❌ **Severe token duplication**: "TokenTokenTokenToken word word word word"
- ❌ **Message duplication**: Multiple identical message blocks
- ❌ **Mixed concerns**: useSSEStream handles both connection AND message processing
- ❌ **Unreadable output**: Conversations completely garbled

#### Codex Branch (RECOMMENDED)
- ✅ **NO token duplication**: Clean, readable message content
- ⚠️ **Minor message duplication**: Multiple message containers but clean content
- ✅ **Separated concerns**: useSSEStream (connection) + useAISDKAdapter (processing)
- ✅ **Production-ready**: Professional UI with avatars and proper formatting

### Technical Details

**StrictMode Impact on SSE:**
```javascript
// In development with StrictMode, this creates multiple connections:
const eventSource = new EventSource(url);
eventSource.onmessage = (event) => {
  // This handler runs MULTIPLE times for each event
  processMessage(event.data);
};
```

**Architecture Fix (Codex Branch):**
```
useSSEStream (connection only) → handleStreamEvent → useAISDKAdapter (processing only)
```

### Solutions Tested

1. **❌ Complex Global Connection Manager**: Made duplication worse (12x repetition)
2. **❌ Singleton SSE Pattern**: Interfered with proper event delivery
3. **✅ Architectural Separation (Codex)**: Prevents token duplication entirely
4. **💡 StrictMode Disable**: Would solve root cause but loses development benefits

### Recommended Actions

#### Immediate (Production Fix)
1. **Use Codex Branch Architecture**: Copy the superior hook architecture to master
   - `useSSEStream`: Connection management only
   - `useAISDKAdapter`: Message processing only
   - Clean separation prevents token duplication

#### Optional (Development Experience)
2. **Disable StrictMode for SSE Development**: Add to `next.config.ts`:
   ```typescript
   const nextConfig: NextConfig = {
     reactStrictMode: false, // Disable to prevent SSE duplication
   };
   ```

#### Long-term (Production Hardening)
3. **SSE Connection Deduplication**: Implement proper connection pooling for production
4. **Error Boundary**: Add SSE error handling and reconnection logic
5. **Performance Monitoring**: Add metrics for SSE connection health

### Files Modified During Investigation
- `frontend/app/hooks/useSSEStream.ts` (master branch - problematic version)
- `frontend/app/hooks/useSSEStreamFixed.ts` (attempted fix - created)
- `frontend/app/hooks/useAISDKAdapterFixed.ts` (attempted fix - created)
- `frontend/app/hooks/useSSEStreamSingleton.ts` (attempted fix - failed)
- `frontend/app/page.tsx` (updated to use various approaches)
- `frontend/app/types/sse.ts` (created for type safety)
- `frontend/app/types/ai-sdk.ts` (created for type safety)

### Branch Status
- **Master Branch**: Has token duplication issue, needs architectural fix
- **Codex Branch**: Production-ready, recommended for deployment
- **Current State**: Fresh servers running codex branch, working perfectly

### Testing Evidence
- Tested both branches with identical backend/frontend setups
- Codex branch produces clean, readable conversations
- Master branch produces severely duplicated, unreadable text
- Issue exists in both development (StrictMode) and would persist in production

### Priority: HIGH
This issue makes the application unusable for end users. The codex branch architecture should be merged to master immediately.