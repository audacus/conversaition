"""Dynamic participant configuration for multi-agent conversations."""

from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict

from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI


CONFIG_PATH = Path(__file__).resolve().parent / "participants_config.json"


def _load_config() -> Dict[str, Dict[str, Any]]:
    if not CONFIG_PATH.exists():
        raise FileNotFoundError(
            "Participant configuration file not found. "
            f"Expected path: {CONFIG_PATH}" 
        )

    with CONFIG_PATH.open("r", encoding="utf-8") as config_file:
        raw = json.load(config_file)

    participants: Dict[str, Dict[str, Any]] = {}
    for entry in raw.get("participants", []):
        participant_id = entry["id"]
        participants[participant_id] = {
            "id": participant_id,
            "name": entry.get("name", participant_id),
            "provider": entry["provider"],
            "model": entry["model"],
            "temperature": float(entry.get("temperature", 0.7)),
            "max_tokens": int(entry.get("max_tokens", 256)),
            "system_prompt": entry["system_prompt"],
        }

    if not participants:
        raise ValueError("No participants defined in participants_config.json")

    return participants


@lru_cache(maxsize=1)
def _participants() -> Dict[str, Dict[str, Any]]:
    return _load_config()


def refresh_participants_cache() -> None:
    """Clear cached participants (call after editing the config file)."""
    _participants.cache_clear()  # type: ignore[attr-defined]


def get_participant_info(participant_id: str) -> Dict[str, Any]:
    participants = _participants()
    if participant_id not in participants:
        raise ValueError(f"Unknown participant: {participant_id}")
    return participants[participant_id]


def get_all_participants() -> Dict[str, Dict[str, Any]]:
    return dict(_participants())


def create_participant_llm(participant_id: str):
    definition = get_participant_info(participant_id)
    provider = definition["provider"]
    model = definition["model"]
    temperature = definition["temperature"]
    max_tokens = definition["max_tokens"]

    if provider == "openai":
        return ChatOpenAI(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=os.getenv("OPENAI_API_KEY"),
        )
    if provider == "anthropic":
        return ChatAnthropic(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=os.getenv("ANTHROPIC_API_KEY"),
        )
    if provider == "gemini":
        return ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature,
            max_output_tokens=max_tokens,
            api_key=os.getenv("GOOGLE_API_KEY"),
        )

    raise ValueError(f"Unsupported provider: {provider}")
