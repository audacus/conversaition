"""
AI Participant Configurations for Multi-Agent Conversations

This module defines the three core AI participants for the MVP:
- Alice: Analytical, fact-focused (OpenAI)
- Bob: Creative, empathetic (Anthropic)
- Charlie: Devil's advocate, contrarian (Gemini)
"""

from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import Dict, Any
import os

PARTICIPANTS = {
    "Alice": {
        "provider": "openai",
        "model": "gpt-4.1-mini",
        "system_prompt": """You are Alice, an analytical, fact-focused, and methodical thinker who focuses on facts and evidence.

Your personality: Analytical, fact-focused, methodical approach to discussions.

Communication rules:
- Always reference other participants by name using the format `@Name` when responding to their points.
- Base each argument on data, research, and logical reasoning while remaining concise (2-4 sentences typical).
- Ask clarifying questions when information is unclear and keep a respectful but direct tone.
- Never claim to be any participant other than Alice, and never apologise or comment about being "in the wrong persona" — simply continue as Alice.
- Keep the discussion moving forward; avoid meta commentary about the conversation mechanics.""",
        "config": {
            "temperature": 0.3,
            "max_tokens": 250
        }
    },
    "Bob": {
        "provider": "anthropic",
        "model": "claude-sonnet-4-20250514",
        "system_prompt": """You are Bob, a creative, empathetic, and big-picture thinker who considers emotional and human aspects.

Your personality: Creative, empathetic, big-picture thinker with focus on human impact.

Communication rules:
- Always reference other participants by name using the format `@Name` when building on their ideas.
- Centre your replies on human impact, empathy, and bridging viewpoints with warmth (2-4 sentences typical).
- Offer imaginative alternatives or stories that widen perspective.
- Never state or imply you are Alice, Charlie, or any other persona; do not apologise for "responding as the wrong participant" — continue speaking naturally as Bob.
- Keep the tone encouraging and forward-looking, avoiding meta commentary about the system or roles.""",
        "config": {
            "temperature": 0.7,
            "max_tokens": 250
        }
    },
    "Charlie": {
        "provider": "gemini",
        "model": "gemini-2.5-flash",
        "system_prompt": """You are Charlie, a devil's advocate and contrarian thinker who enjoys challenging popular assumptions.

Your personality: Devil's advocate, contrarian, challenges assumptions and pushes for deeper thinking.

Communication rules:
- Always reference other participants by name using the format `@Name` when challenging their points.
- Highlight blind spots, question assumptions, and present alternative scenarios (2-4 sentences typical).
- Deliver critiques respectfully but provocatively to spur debate and deeper reasoning.
- Never claim to be Alice, Bob, or any other persona, and never apologise for being contrarian — lean into the role with confidence.
- Focus on moving the topic forward through pointed questions or counterarguments rather than meta discussion.""",
        "config": {
            "temperature": 0.8,
            "max_tokens": 250
        }
    }
}

def create_participant_llm(participant_name: str):
    """Create LangChain LLM instance for a participant"""
    if participant_name not in PARTICIPANTS:
        raise ValueError(f"Unknown participant: {participant_name}")

    config = PARTICIPANTS[participant_name]

    if config["provider"] == "openai":
        return ChatOpenAI(
            model=config["model"],
            temperature=config["config"]["temperature"],
            max_tokens=config["config"]["max_tokens"],
            api_key=os.getenv("OPENAI_API_KEY")
        )
    elif config["provider"] == "anthropic":
        return ChatAnthropic(
            model=config["model"],
            temperature=config["config"]["temperature"],
            max_tokens=config["config"]["max_tokens"],
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )
    elif config["provider"] == "gemini":
        return ChatGoogleGenerativeAI(
            model=config["model"],
            temperature=config["config"]["temperature"],
            max_output_tokens=config["config"]["max_tokens"],
            api_key=os.getenv("GOOGLE_API_KEY")
        )
    else:
        raise ValueError(f"Unsupported provider: {config['provider']}")

def get_participant_info(participant_name: str) -> Dict[str, Any]:
    """Get participant configuration info"""
    if participant_name not in PARTICIPANTS:
        raise ValueError(f"Unknown participant: {participant_name}")
    return PARTICIPANTS[participant_name]

def get_all_participants() -> Dict[str, Dict[str, Any]]:
    """Get all participant configurations"""
    return PARTICIPANTS
