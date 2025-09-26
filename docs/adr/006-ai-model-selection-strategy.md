# 006 - AI Model Selection Strategy

**Date:** 2025-09-26
**Status:** Accepted

## Context

The Conversaition project aims to create distinct, engaging AI personalities for multi-participant conversations. Model selection directly impacts conversation quality, personality differentiation, and operational costs. During MVP development, we needed to choose specific models that would provide the best combination of performance, distinct capabilities, and cost-effectiveness.

Original approach considerations:
1. Use older, well-tested models (GPT-3.5, Claude-2, etc.) for stability
2. Mix of latest and older models for cost optimization
3. Latest available models from each provider (chosen approach)

Key requirements for model selection:
- **Distinct Personalities**: Models should have different strengths and response styles
- **Streaming Support**: All models must support real-time streaming for responsive UX
- **Context Awareness**: Strong ability to reference other participants and maintain conversation context
- **Cost Efficiency**: Balance performance with API costs for extended conversations

## Decision

We will implement a **Latest AI Models Strategy** that prioritizes using the most recent, highest-capability models from each AI provider to ensure optimal conversation quality and distinct participant personalities.

### Selected Models:

#### Alice (OpenAI) - Analytical Participant
- **Model**: `gpt-4.1-mini`
- **Rationale**: Latest efficient GPT-4 variant, excellent analytical capabilities
- **Personality**: Fact-focused, methodical, data-driven responses
- **Strengths**: Logical reasoning, structured analysis, concise communication

#### Bob (Anthropic) - Creative Participant
- **Model**: `claude-sonnet-4-20250514`
- **Rationale**: Latest Claude model, superior creative and empathetic responses
- **Personality**: Creative, empathetic, big-picture thinking
- **Strengths**: Human impact consideration, warm communication, contextual creativity

#### Charlie (Google) - Contrarian Participant
- **Model**: `gemini-2.5-flash`
- **Rationale**: Fast, capable model with strong reasoning for devil's advocate role
- **Personality**: Contrarian, assumption-challenging, thought-provoking
- **Strengths**: Critical thinking, alternative perspectives, intellectual provocation

### Model Selection Criteria:
1. **Recency**: Latest available models for cutting-edge capabilities
2. **Provider Diversity**: Different AI architectures for varied response styles
3. **Streaming Compatibility**: Verified real-time streaming support
4. **Context Length**: Sufficient context windows for conversation history
5. **Response Quality**: High-quality, conversational outputs

## Consequences

### Benefits
- **Superior Performance**: Latest models provide best available reasoning and communication
- **Distinct Personalities**: Each model's unique architecture creates natural personality differentiation
- **Future-Proof**: Using latest models ensures compatibility with evolving AI capabilities
- **Optimal User Experience**: High-quality responses create engaging conversations
- **Streaming Excellence**: All models support real-time streaming for responsive interactions

### Trade-offs
- **Higher Costs**: Latest models typically have premium pricing vs older alternatives
- **API Stability**: Newer models may have evolving API contracts and behavior changes
- **Rate Limits**: Latest models often have stricter usage quotas during initial release
- **Model Deprecation**: Need to monitor and update as models are superseded

### Operational Requirements
- **Cost Monitoring**: Track API usage and implement conversation length limits if needed
- **Model Updates**: Regular review and updates as new models are released
- **Fallback Strategy**: Implement graceful degradation to older models if latest models fail
- **Performance Monitoring**: Track response quality, latency, and error rates per model

### Evolution Strategy
- **Quarterly Review**: Assess new model releases and performance improvements
- **A/B Testing**: Test new models against current selection for quality comparison
- **Cost Optimization**: Monitor usage patterns and optimize model selection for cost/quality balance
- **Community Feedback**: Use user feedback to guide model selection and personality tuning

## Implementation Patterns

### Current Model Configuration:
```python
# participants.py - Latest model implementation
PARTICIPANTS = {
    "Alice": {
        "provider": "openai",
        "model": "gpt-4.1-mini",
        "config": {
            "temperature": 0.7,
            "max_tokens": 2048
        }
    },
    "Bob": {
        "provider": "anthropic",
        "model": "claude-sonnet-4-20250514",
        "config": {
            "temperature": 0.8,
            "max_tokens": 2048
        }
    },
    "Charlie": {
        "provider": "gemini",
        "model": "gemini-2.5-flash",
        "config": {
            "temperature": 0.9,
            "max_tokens": 2048
        }
    }
}
```

### Model Update Pattern:
```python
# Version management for model evolution
MODEL_VERSIONS = {
    "alice": {
        "current": "gpt-4.1-mini",
        "fallback": "gpt-4-turbo",
        "deprecated": ["gpt-3.5-turbo"]
    },
    "bob": {
        "current": "claude-sonnet-4-20250514",
        "fallback": "claude-3-5-sonnet-20241022",
        "deprecated": ["claude-3-sonnet"]
    },
    "charlie": {
        "current": "gemini-2.5-flash",
        "fallback": "gemini-1.5-pro",
        "deprecated": ["gemini-1.0-pro"]
    }
}
```

### Cost Optimization Pattern:
```python
# Usage-based model selection
async def select_optimal_model(participant: str, conversation_length: int) -> str:
    """Select model based on conversation context and cost considerations"""
    if conversation_length > 50:  # Long conversations
        return MODEL_VERSIONS[participant]["fallback"]  # More cost-effective
    else:
        return MODEL_VERSIONS[participant]["current"]   # Best quality
```

## Related Decisions
- [001] LangGraph to AI SDK Adapter Architecture - Model integration patterns
- [002] LangGraph Multi-Agent Conversation Patterns - Model-specific context handling
- [003] MVP-First Architecture Strategy - Model selection for rapid validation
- [005] Simplified Participant Model - Model-optimized system prompts
- Cost optimization strategy (future ADR)
- Multi-modal model integration (future ADR)