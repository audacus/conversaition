# 005 - Simplified Participant Model

**Date:** 2025-09-26
**Status:** Accepted

## Context

The original README.md participant model included separate fields for `system_prompt`, `expertise`, and role definitions. During MVP implementation, we discovered that maintaining separate expertise arrays and role configurations added complexity without significant benefit for the core conversation functionality.

Original planned model:
```json
{
  "config": {
    "system_prompt": "Base prompt template",
    "expertise": ["AI Ethics", "Machine Learning", "Philosophy"],
    "role": "analytical_expert",
    "personality": "methodical_researcher"
  }
}
```

Alternative approaches considered:
1. Keep complex model with separate expertise/role fields
2. Use template-based system prompts with variable substitution
3. Consolidate everything into comprehensive system prompts (chosen approach)

## Decision

We will implement a **Simplified Participant Model** that consolidates personality, role, and expertise definitions into comprehensive system prompts. This reduces configuration complexity while maintaining full expressive power for AI participant definitions.

### Simplified Model:
```json
{
  "id": "Alice",
  "name": "Alice",
  "type": "ai",
  "provider": "openai",
  "model": "gpt-4.1-mini",
  "config": {
    "system_prompt": "You are Alice, an analytical, fact-focused, and methodical thinker with expertise in data analysis and logical reasoning. In conversations with other AI participants and humans: always reference other participants by name when responding to their points, base your arguments on data and research, keep responses concise but thorough (2-4 sentences typical).",
    "temperature": 0.7,
    "max_tokens": 2048,
    "weight": 1.0
  }
}
```

### Key Changes:
- **Single System Prompt**: Comprehensive prompt includes personality, role, expertise, and conversation behavior
- **Removed Fields**: `expertise` array, separate `role` field, `personality` field
- **Maintained**: Core configuration options (temperature, max_tokens, weight)
- **Enhanced Prompts**: More detailed behavioral instructions integrated into system prompt

## Consequences

### Benefits
- **Reduced Complexity**: Single configuration field vs multiple interconnected fields
- **Greater Flexibility**: System prompts can include nuanced instructions not captured by structured fields
- **Easier Management**: Simpler participant configuration and editing
- **Better AI Behavior**: Comprehensive prompts provide clearer context and instructions
- **Maintainability**: Fewer fields to validate, update, and synchronize

### Trade-offs
- **Less Structured Metadata**: Cannot easily query participants by expertise area
- **Prompt Engineering Required**: Requires careful system prompt crafting vs template filling
- **No Automatic Templates**: Cannot generate prompts from structured expertise/role data
- **Manual Consistency**: Must manually ensure consistent prompt formats across participants

### Migration Considerations
- Existing expertise-based features would require system prompt parsing
- Search/filtering by expertise would need alternative implementation
- Template systems would need to work with full system prompts
- Analytics based on structured roles/expertise would require prompt analysis

## Implementation Patterns

### Current MVP Implementation:
```python
# participants.py - Simplified configuration
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
    }
}
```

### Future Structured Approach (if needed):
```python
# Optional: Extract structure from system prompts
def parse_participant_attributes(system_prompt: str) -> dict:
    """Extract structured data from comprehensive system prompts"""
    # Use LLM or regex to identify expertise areas, personality traits
    # Return structured metadata for search/filtering
    pass

def generate_system_prompt(name: str, personality: str, expertise: list, role: str) -> str:
    """Generate comprehensive system prompt from structured components"""
    return f"You are {name}, a {personality} thinker with expertise in {', '.join(expertise)}..."
```

### Conversation Context Pattern:
```python
# Enhanced context building with comprehensive prompts
def build_conversation_context(messages: list, current_speaker: str) -> list:
    participant_config = PARTICIPANTS[current_speaker]

    # System prompt already includes all necessary context
    system_message = {
        "role": "system",
        "content": participant_config["system_prompt"]
    }

    return [system_message] + messages
```

## Related Decisions
- [001] LangGraph to AI SDK Adapter Architecture - Participant integration
- [002] LangGraph Multi-Agent Conversation Patterns - Context building
- [003] MVP-First Architecture Strategy - Simplified configuration priority
- [006] AI Model Selection Strategy - Model-specific prompt optimization
- Future participant template system (future ADR)