# 007 - LLM-Based Turn Coordination

**Date:** 2025-10-14
**Status:** Accepted

## Context

Currently, Conversaition uses a round-robin approach with @mention-based preferences for determining which AI participant speaks next. While functional, this approach has limitations:

1. **Rigid sequencing**: Participants speak in fixed order regardless of conversation flow
2. **Limited context**: Only @mentions influence speaker selection
3. **Unnatural conversation**: Real discussions don't follow strict turn-taking patterns
4. **Missed opportunities**: Can't optimize for topic relevance, question-answering, or debate dynamics

We need a more intelligent turn coordination mechanism that:
- Considers conversation context and flow
- Balances participation across participants
- Responds to direct questions and requests
- Maintains natural discussion dynamics
- Performs quickly to avoid latency

## Decision

Implement **LLM-based turn coordination** using Gemini 2.5 Flash Lite as a dedicated coordinator node in the LangGraph workflow.

### Architecture

**Graph flow change:**
```
Before: scheduler (round-robin) → pause_check → ai_response → ...
After:  turn_coordinator (LLM) → pause_check → ai_response → ...
```

**Coordinator placement:** BEFORE generate_response to decide both:
- First speaker (based on topic)
- Subsequent speakers (based on conversation history)

**Model selection:** Gemini 2.5 Flash Lite
- Fast inference for minimal latency
- Cost-effective for repeated coordination calls
- Sufficient capability for turn selection logic

**Configuration:** Add `_coordinator` entry to participants_config.json
```json
{
  "_coordinator": {
    "provider": "gemini",
    "model": "gemini-2.5-flash-lite",
    "temperature": 0.3,
    "max_tokens": 150
  }
}
```

### Decision Criteria

The coordinator LLM considers:
1. **Recent speakers**: Avoid same person twice in a row
2. **Topic relevance**: Match participant expertise to current discussion
3. **Participation balance**: Ensure all participants contribute
4. **Direct requests**: Prioritize when someone is explicitly asked a question
5. **Conversation dynamics**: Maintain natural debate/discussion flow

### Fallback Strategy

On coordinator error/timeout/invalid response:
- Fall back to round-robin selection
- Log error for monitoring
- Continue conversation without interruption

### Output Format

```json
{
  "type": "turn-decision",
  "next_speaker": "Alice",
  "reasoning": "Alice asked Bob a direct question about X"
}
```

Reasoning is included for:
- Transparency (users can see why participants were selected)
- Debugging (understand coordinator behavior)
- Analytics (track decision patterns)

## Consequences

### Benefits

- **Natural flow**: Conversations feel more organic and responsive
- **Context-aware**: Decisions based on full conversation history
- **Flexible**: Easy to tune coordinator prompts for different conversation styles
- **Extensible**: Foundation for future features (conversation templates, dynamic personas)
- **Transparent**: Reasoning provides insight into AI decision-making

### Trade-offs

- **Latency**: Additional LLM call before each response (~100-300ms with Flash Lite)
- **Cost**: Gemini Flash Lite calls per turn (minimal, ~$0.0001/turn)
- **Complexity**: More moving parts than round-robin
- **Determinism**: Less predictable than fixed ordering
- **Failure modes**: Requires fallback handling for invalid responses

### Implementation Requirements

**Phase 1 (This PR):**
- Add Gemini 2.5 Flash Lite to participants_config.json as `_coordinator`
- Add `_system_prompt_base` for shared participant instructions
- Implement `turn_coordinator` node in conversation_graph.py
- Update graph flow to call coordinator before ai_response
- Send full conversation history to coordinator
- Implement fallback to round-robin on error
- Add coordinator decision as system message (visible to users, filtered from participants)

**Phase 2 (Future):**
- Optimize with message metadata instead of full content
- Add toggleable modes (LLM vs round-robin)
- Implement structured mention/request tags: `<mention>Name</mention>`, `<request to="Name">question</request>`
- Add `<message from="Name">content</message>` wrapper format
- Add analytics for coordinator decision patterns

**Phase 3 (Future):**
- Conversation templates (debate, brainstorm, code review)
- Dynamic participant inclusion/exclusion based on topic
- Multi-hop reasoning (planning multiple turns ahead)

## Alternatives Considered

### Alternative 1: Weighted Round-Robin
**Description:** Assign weights based on @mentions and recent activity

**Pros:**
- Deterministic and predictable
- No additional LLM calls
- Simple to implement

**Cons:**
- Still rigid, limited context awareness
- Can't respond to nuanced conversation flow
- Weights difficult to tune for different scenarios

**Rejected because:** Doesn't address core limitation of context-unaware selection

### Alternative 2: Rule-Based Heuristics
**Description:** Complex rules for speaker selection (if question → person mentioned, if disagreement → contrarian, etc.)

**Pros:**
- Fast, no LLM overhead
- Explicit logic, easier to debug
- Deterministic behavior

**Cons:**
- Brittle, doesn't generalize
- Requires extensive rule engineering
- Can't adapt to unexpected conversation patterns
- Hard to maintain as scenarios grow

**Rejected because:** Too rigid, doesn't leverage LLM understanding of context

### Alternative 3: Reinforcement Learning
**Description:** Train RL agent to select speakers based on conversation quality metrics

**Pros:**
- Could optimize for specific conversation goals
- Learns from data

**Cons:**
- Requires large training dataset
- Complex infrastructure
- Harder to explain decisions
- Overkill for current scope

**Rejected because:** Too complex for MVP, LLM approach simpler and more transparent

## Related Decisions

- [001 - LangGraph to AI SDK Adapter](./001-langgraph-ai-sdk-adapter.md): Coordinator events will use same SSE streaming
- [005 - Simplified Participant Model](./005-simplified-participant-model.md): Coordinator fits into external configuration pattern

## Future Work

- **Message metadata optimization**: Send only message length, word count, mentions, requests instead of full content
- **Conversation templates**: Pre-configured coordinator prompts for different discussion types
- **A/B testing**: Compare LLM coordinator vs round-robin for quality metrics
- **Multi-coordinator**: Different coordination strategies for different conversation phases
