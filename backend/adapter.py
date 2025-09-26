"""
LangGraph to AI SDK Event Adapter

This module converts LangGraph conversation events to AI SDK compatible format
for streaming to the frontend. Based on the AI SDK Stream Protocol specification.
"""

import json
from typing import Dict, Any, AsyncGenerator
import asyncio
import logging

logger = logging.getLogger(__name__)

class LangGraphToAISDKAdapter:
    """Adapter to convert LangGraph conversation events to AI SDK stream format"""

    def __init__(self):
        self.active_participant = None
        self.message_buffer = ""

    async def convert_event(self, langgraph_event: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert LangGraph event to AI SDK compatible format

        AI SDK Stream Protocol: https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol

        Expected AI SDK event types:
        - text-start: Start of text generation
        - text-delta: Incremental text content
        - text-done: End of text generation
        - tool-call: Tool execution start
        - tool-result: Tool execution result
        - error: Error occurred
        """
        event_type = langgraph_event.get("type", "unknown")
        event_data = langgraph_event.get("data", {})

        if event_type == "conversation_start":
            return {
                "type": "conversation-start",
                "data": {
                    "topic": event_data.get("topic"),
                    "participants": event_data.get("participants", [])
                }
            }

        elif event_type == "conversation_status":
            return {
                "type": "conversation_status",
                "data": {
                    "active": event_data.get("active"),
                    "paused": event_data.get("paused"),
                    "participants": event_data.get("participants", []),
                    "topic": event_data.get("topic"),
                }
            }

        elif event_type == "speaker_scheduled":
            self.active_participant = event_data.get("next_speaker")
            return {
                "type": "speaker-change",
                "data": {
                    "participant": self.active_participant,
                    "turn": event_data.get("turn", 0)
                }
            }

        elif event_type == "ai_thinking_start":
            return {
                "type": "thinking-start",
                "data": {
                    "participant": event_data.get("participant"),
                    "model": event_data.get("model")
                }
            }

        elif event_type == "ai_response_start":
            self.message_buffer = ""
            return {
                "type": "text-start",
                "data": {
                    "participant": event_data.get("participant")
                }
            }

        elif event_type == "ai_response_stream":
            content_chunk = event_data.get("content", "")
            self.message_buffer += content_chunk
            return {
                "type": "text-delta",
                "data": {
                    "textDelta": content_chunk,
                    "participant": event_data.get("participant")
                }
            }

        elif event_type == "ai_response_complete":
            result = {
                "type": "text-done",
                "data": {
                    "participant": event_data.get("participant"),
                    "content": event_data.get("content"),
                    "finishReason": "stop"
                }
            }
            self.message_buffer = ""
            return result

        elif event_type == "human_message_added":
            return {
                "type": "user-message",
                "data": {
                    "content": event_data.get("content")
                }
            }

        elif event_type == "turn_complete":
            return {
                "type": "turn-complete",
                "data": {
                    "turn": event_data.get("turn"),
                    "totalMessages": event_data.get("total_messages")
                }
            }

        elif event_type == "ai_response_error":
            return {
                "type": "error",
                "data": {
                    "error": event_data.get("error"),
                    "participant": event_data.get("participant")
                }
            }

        elif event_type == "conversation_end":
            return {
                "type": "conversation-end",
                "data": {
                    "message": event_data.get("message"),
                    "participants": event_data.get("participants", []),
                    "topic": event_data.get("topic"),
                }
            }

        else:
            # Generic conversation event
            return {
                "type": "conversation-event",
                "data": {
                    "eventType": event_type,
                    "participant": event_data.get("participant"),
                    "data": event_data
                }
            }

    def format_for_sse(self, ai_sdk_event: Dict[str, Any]) -> str:
        """Format AI SDK event for Server-Sent Events"""
        return json.dumps(ai_sdk_event)

class ConversationEventStreamer:
    """Manages streaming of conversation events to SSE clients"""

    def __init__(self):
        self.adapter = LangGraphToAISDKAdapter()
        self.clients = []

    def add_client(self, queue: asyncio.Queue):
        """Add SSE client queue"""
        self.clients.append(queue)

    def remove_client(self, queue: asyncio.Queue):
        """Remove SSE client queue"""
        if queue in self.clients:
            self.clients.remove(queue)

    async def handle_langgraph_event(self, langgraph_event: Dict[str, Any]):
        """Convert and broadcast LangGraph event to all clients"""
        try:
            # Convert to AI SDK format
            ai_sdk_event = await self.adapter.convert_event(langgraph_event)

            logger.info(f"Broadcasting event: {ai_sdk_event['type']}")

            # Broadcast to all connected clients
            for client_queue in self.clients.copy():  # Copy to avoid modification during iteration
                try:
                    await client_queue.put(ai_sdk_event)
                except Exception as e:
                    logger.error(f"Error sending to client: {e}")
                    self.remove_client(client_queue)

        except Exception as e:
            logger.error(f"Error handling LangGraph event: {e}")

    async def generate_sse_stream(self, client_queue: asyncio.Queue) -> AsyncGenerator[str, None]:
        """Generate SSE formatted stream for a client"""
        try:
            while True:
                # Wait for event from conversation graph
                ai_sdk_event = await client_queue.get()

                # Format for SSE
                sse_data = self.adapter.format_for_sse(ai_sdk_event)
                yield sse_data

                # End stream if conversation ends
                if ai_sdk_event.get("type") == "conversation-end":
                    break

        except asyncio.CancelledError:
            logger.info("SSE stream cancelled")
            raise
        except Exception as e:
            logger.error(f"Error in SSE stream: {e}")
            # Send error event
            error_event = {
                "type": "error",
                "data": {"error": str(e)}
            }
            yield self.adapter.format_for_sse(error_event)
        finally:
            self.remove_client(client_queue)

# Global streamer instance
conversation_streamer = ConversationEventStreamer()
