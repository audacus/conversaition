from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Mapping, Any, List, Dict, Optional
from collections import Counter

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

    def persist(
        self,
        *,
        topic: str | None,
        participants: Iterable[str],
        messages: Iterable[BaseMessage],
        metadata: Optional[Mapping[str, Any]] = None,
    ) -> Path:
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

        # Filter out empty messages (from interrupted streaming)
        serialized_messages = [
            self._serialise_message(message) for message in messages
        ]
        non_empty_messages = [
            msg for msg in serialized_messages
            if msg.get("content", "").strip()
        ]

        payload = {
            "topic": topic,
            "participants": list(participants),
            "created_at": timestamp,
            "messages": non_empty_messages,
        }

        if metadata:
            payload["metadata"] = dict(metadata)

        file_path = self.base_path / f"conversation-{timestamp}.json"
        file_path.write_text(json.dumps(payload, ensure_ascii=True, indent=2))
        return file_path

    def list_transcripts(self, limit: int = 25) -> List[Dict[str, Any]]:
        files = sorted(self.base_path.glob('conversation-*.json'), reverse=True)
        transcripts: List[Dict[str, Any]] = []
        for file_path in files[:limit]:
            try:
                data = json.loads(file_path.read_text())
            except Exception:
                continue

            metadata = data.get("metadata", {})
            transcripts.append({
                "filename": file_path.name,
                "topic": data.get("topic"),
                "participants": data.get("participants", []),
                "message_count": len(data.get("messages", [])),
                "started_at": metadata.get("started_at"),
                "ended_at": metadata.get("stopped_at"),
                "duration_seconds": metadata.get("duration_seconds"),
            })
        return transcripts

    def load_transcript(self, transcript_id: str) -> Dict[str, Any]:
        safe_name = Path(transcript_id).name
        file_path = self.base_path / safe_name
        if not file_path.exists() or not file_path.is_file():
            raise FileNotFoundError(f"Transcript {transcript_id} not found")
        return json.loads(file_path.read_text())

    def summarise(self, limit: int = 100) -> Dict[str, Any]:
        transcripts = self.list_transcripts(limit=limit)
        participant_counter: Counter[str] = Counter()
        total_messages = 0
        topics = []
        total_duration = 0
        duration_samples = 0

        for entry in transcripts:
            total_messages += entry.get("message_count", 0)
            topics.append(entry.get("topic"))
            for participant in entry.get("participants", []):
                participant_counter[participant] += 1

            metadata = entry.get("metadata") or {}
            if isinstance(metadata, dict):
                duration = metadata.get("duration_seconds")
                if isinstance(duration, (int, float)) and duration >= 0:
                    total_duration += duration
                    duration_samples += 1

        return {
            "total_transcripts": len(transcripts),
            "total_messages": total_messages,
            "participant_appearances": dict(participant_counter),
            "latest_topic": topics[0] if topics else None,
            "average_duration_seconds": (total_duration / duration_samples) if duration_samples else None,
        }


transcript_store = TranscriptStore()
