from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Mapping, Any

from langchain_core.messages import BaseMessage


class TranscriptStore:
    """Persist conversation transcripts to disk for future analytics/export."""

    def __init__(self, base_directory: Path | None = None) -> None:
        base_path = base_directory or Path(__file__).resolve().parent.parent / "data" / "transcripts"
        self.base_path = base_path
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _serialise_message(self, message: BaseMessage) -> Mapping[str, Any]:
        return {
            "role": getattr(message, "type", message.__class__.__name__.lower()),
            "content": getattr(message, "content", ""),
            "metadata": getattr(message, "additional_kwargs", {}),
        }

    def persist(self, *, topic: str | None, participants: Iterable[str], messages: Iterable[BaseMessage]) -> Path:
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        payload = {
            "topic": topic,
            "participants": list(participants),
            "created_at": timestamp,
            "messages": [self._serialise_message(message) for message in messages],
        }

        file_path = self.base_path / f"conversation-{timestamp}.json"
        file_path.write_text(json.dumps(payload, ensure_ascii=True, indent=2))
        return file_path


transcript_store = TranscriptStore()
