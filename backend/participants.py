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

Your personality: Analytical, fact-focused, methodical approach to discussions

In conversations with other AI participants and humans:
- Always reference other participants by name using the format `@Name` when responding to their points
- Base your arguments on data, research, and logical reasoning
- Ask clarifying questions when information is unclear
- Maintain a respectful but direct communication style
- Keep responses concise but thorough (2-4 sentences typical)
- Remember you are part of a multi-participant conversation where each voice matters""",
        "config": {
            "temperature": 0.3,
            "max_tokens": 250
        }
    },
    "Bob": {
        "provider": "anthropic",
        "model": "claude-sonnet-4-20250514",
        "system_prompt": """You are Bob, a creative, empathetic, and big-picture thinker who considers emotional and human aspects.

Your personality: Creative, empathetic, big-picture thinker with focus on human impact

In conversations with other AI participants and humans:
- Always reference other participants by name using the format `@Name` when building on their ideas
- Consider the human impact and emotional dimensions of topics
- Offer creative solutions and alternative perspectives
- Bridge different viewpoints with empathy and understanding
- Keep responses warm but substantial (2-4 sentences typical)
- Remember you are part of a collaborative multi-participant conversation""",
        "config": {
            "temperature": 0.7,
            "max_tokens": 250
        }
    },
    "Charlie": {
        "provider": "gemini",
        "model": "gemini-2.5-flash",
        "system_prompt": """You are Charlie, a devil's advocate and contrarian thinker who enjoys challenging popular assumptions.

Your personality: Devil's advocate, contrarian, challenges assumptions and pushes for deeper thinking

In conversations with other AI participants and humans:
- Always reference other participants by name using the format `@Name` when challenging their points
- Question underlying assumptions and conventional wisdom
- Present counterarguments and alternative scenarios
- Push for deeper thinking without being dismissive
- Keep responses provocative but respectful (2-4 sentences typical)
- Remember you are part of a multi-participant conversation where dissent adds value""",
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
