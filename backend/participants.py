"""Dynamic participant configuration for multi-agent conversations."""

from __future__ import annotations

import json
import os
import tempfile
import shutil
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List

from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI


CONFIG_PATH = Path(__file__).resolve().parent / "participants_config.json"
ALLOWED_PROVIDERS = {"openai", "anthropic", "gemini"}


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
    system_prompt = definition["system_prompt"]

    if provider == "openai":
        return ChatOpenAI(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            streaming=True,
            api_key=os.getenv("OPENAI_API_KEY"),
        ), system_prompt
    if provider == "anthropic":
        return ChatAnthropic(
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            streaming=True,
            api_key=os.getenv("ANTHROPIC_API_KEY"),
        ), system_prompt
    if provider == "gemini":
        return ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature,
            max_output_tokens=max_tokens,
            streaming=True,
            # Gemini uses system_instruction parameter - system prompt already set
            system_instruction=system_prompt,
        ), None  # System prompt handled by system_instruction parameter

    raise ValueError(f"Unsupported provider: {provider}")


def validate_participant(data: Dict[str, Any]) -> List[str]:
    """Validate participant data and return list of error messages."""
    errors = []

    if not data.get("id"):
        errors.append("Field 'id' is required")
    elif not isinstance(data["id"], str) or not data["id"].strip():
        errors.append("Field 'id' must be a non-empty string")

    if not data.get("name"):
        errors.append("Field 'name' is required")

    provider = data.get("provider")
    if not provider:
        errors.append("Field 'provider' is required")
    elif provider not in ALLOWED_PROVIDERS:
        errors.append(f"Provider must be one of: {', '.join(ALLOWED_PROVIDERS)}")

    if not data.get("model"):
        errors.append("Field 'model' is required")

    if not data.get("system_prompt"):
        errors.append("Field 'system_prompt' is required")

    # Optional fields with type validation
    if "temperature" in data:
        try:
            temp = float(data["temperature"])
            if not (0.0 <= temp <= 2.0):
                errors.append("Field 'temperature' must be between 0.0 and 2.0")
        except (ValueError, TypeError):
            errors.append("Field 'temperature' must be a number")

    if "max_tokens" in data:
        try:
            tokens = int(data["max_tokens"])
            if tokens <= 0:
                errors.append("Field 'max_tokens' must be a positive integer")
        except (ValueError, TypeError):
            errors.append("Field 'max_tokens' must be an integer")

    return errors


def atomic_write_config(participants: List[Dict[str, Any]]) -> None:
    """Atomically write participants config using temp file + move pattern."""
    config_data = {"participants": participants}

    # Write to temporary file in the same directory
    temp_fd, temp_path = tempfile.mkstemp(
        dir=CONFIG_PATH.parent,
        prefix=".participants_config_",
        suffix=".json.tmp",
        text=True
    )

    try:
        # Write JSON to temp file
        with os.fdopen(temp_fd, "w", encoding="utf-8") as temp_file:
            json.dump(config_data, temp_file, indent=2, ensure_ascii=False)
            temp_file.write("\n")

        # Atomically replace original file
        shutil.move(temp_path, CONFIG_PATH)
    except Exception:
        # Clean up temp file if something goes wrong
        if os.path.exists(temp_path):
            os.unlink(temp_path)
        raise


def create_participant(participant_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new participant and persist to config."""
    # Validate input
    errors = validate_participant(participant_data)
    if errors:
        raise ValueError(f"Validation failed: {'; '.join(errors)}")

    # Load current config
    current_config = _load_config()

    # Check for duplicate ID
    if participant_data["id"] in current_config:
        raise ValueError(f"Participant with id '{participant_data['id']}' already exists")

    # Get raw participant list
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        raw = json.load(f)
    participants_list = raw.get("participants", [])

    # Add new participant
    new_participant = {
        "id": participant_data["id"],
        "name": participant_data.get("name", participant_data["id"]),
        "provider": participant_data["provider"],
        "model": participant_data["model"],
        "temperature": float(participant_data.get("temperature", 0.7)),
        "max_tokens": int(participant_data.get("max_tokens", 256)),
        "system_prompt": participant_data["system_prompt"],
    }
    participants_list.append(new_participant)

    # Atomic write
    atomic_write_config(participants_list)

    # Refresh cache
    refresh_participants_cache()

    return new_participant


def update_participant(participant_id: str, participant_data: Dict[str, Any]) -> Dict[str, Any]:
    """Update an existing participant and persist to config."""
    # Ensure ID matches
    if participant_data.get("id") and participant_data["id"] != participant_id:
        raise ValueError("Cannot change participant ID")

    participant_data["id"] = participant_id

    # Validate input
    errors = validate_participant(participant_data)
    if errors:
        raise ValueError(f"Validation failed: {'; '.join(errors)}")

    # Load current config
    current_config = _load_config()

    # Check participant exists
    if participant_id not in current_config:
        raise ValueError(f"Participant with id '{participant_id}' not found")

    # Get raw participant list
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        raw = json.load(f)
    participants_list = raw.get("participants", [])

    # Update participant
    updated_participant = {
        "id": participant_id,
        "name": participant_data.get("name", participant_id),
        "provider": participant_data["provider"],
        "model": participant_data["model"],
        "temperature": float(participant_data.get("temperature", 0.7)),
        "max_tokens": int(participant_data.get("max_tokens", 256)),
        "system_prompt": participant_data["system_prompt"],
    }

    # Replace in list
    participants_list = [
        updated_participant if p["id"] == participant_id else p
        for p in participants_list
    ]

    # Atomic write
    atomic_write_config(participants_list)

    # Refresh cache
    refresh_participants_cache()

    return updated_participant


def delete_participant(participant_id: str) -> None:
    """Delete a participant and persist to config."""
    # Load current config
    current_config = _load_config()

    # Check participant exists
    if participant_id not in current_config:
        raise ValueError(f"Participant with id '{participant_id}' not found")

    # Get raw participant list
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        raw = json.load(f)
    participants_list = raw.get("participants", [])

    # Remove participant
    participants_list = [p for p in participants_list if p["id"] != participant_id]

    # Ensure at least one participant remains
    if not participants_list:
        raise ValueError("Cannot delete the last participant")

    # Atomic write
    atomic_write_config(participants_list)

    # Refresh cache
    refresh_participants_cache()
