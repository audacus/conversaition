"""
LangGraph Multi-Agent Conversation Orchestration

This module implements the core conversation flow using LangGraph:
- Turn management between AI participants
- Conversation state management
- Event streaming for real-time updates
"""

from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
import asyncio
import json
from participants import create_participant_llm, get_participant_info, create_coordinator_llm
import logging
import re
import uuid
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConversationState(TypedDict):
    messages: List[BaseMessage]
    participants: List[str]
    current_speaker: str
    turn_count: int
    conversation_active: bool
    human_input_pending: bool
    conversation_paused: bool
    topic: Optional[str]
    preferred_next_speaker: Optional[str]
    preferred_bias_remaining: int
    round_robin_pointer: int
    requests: List[str]  # Format: ["Alice:Human", "Bob:Charlie"]
    mentions: List[str]  # Format: ["Alice:Bob", "Charlie:Alice"]

class ConversationGraph:
    def __init__(self):
        self.graph = self._build_graph()
        self.event_callbacks = []
        self.current_state = None
        self.current_participants: List[str] = []
        self.current_topic: Optional[str] = None
        self.current_conversation_id: Optional[str] = None
        self.conversation_started_at: Optional[datetime] = None
        self.mention_pattern = re.compile(r"<mention>([A-Za-z0-9_-]+)</mention>")
        self.request_pattern = re.compile(r'<request to="([A-Za-z0-9_-]+)">')
        self.human_input_event = asyncio.Event()
        self.pending_human_message: Optional[str] = None

    def _build_graph(self):
        """Build the LangGraph conversation flow with LLM-based turn coordination"""
        graph = StateGraph(ConversationState)

        # Core nodes
        graph.add_node("turn_coordinator", self._turn_coordinator)
        graph.add_node("pause_check", self._check_pause_status)
        graph.add_node("ai_response", self._generate_ai_response)
        graph.add_node("human_check", self._check_human_input)
        graph.add_node("end_turn", self._end_turn)

        # Define flow: coordinator → pause → response → human_check → end_turn → loop
        graph.set_entry_point("turn_coordinator")
        graph.add_edge("turn_coordinator", "pause_check")
        graph.add_conditional_edges("pause_check", self._route_after_pause_check)
        graph.add_edge("ai_response", "human_check")
        graph.add_conditional_edges("human_check", self._route_after_human_check)
        graph.add_edge("end_turn", "turn_coordinator")

        return graph.compile()

    def add_event_callback(self, callback):
        """Add callback for streaming events"""
        self.event_callbacks.append(callback)

    async def _emit_event(self, event_type: str, data: Dict[str, Any]):
        """Emit event to all callbacks"""
        event = {
            "type": event_type,
            "data": data,
            "timestamp": asyncio.get_event_loop().time()
        }

        for callback in self.event_callbacks:
            try:
                await callback(event)
            except Exception as e:
                logger.error(f"Error in event callback: {e}")

    def _extract_requests(
        self,
        content: Optional[str],
        participants: List[str],
        current_speaker: Optional[str],
    ) -> List[str]:
        """Extract request targets from message content. Returns format ['Speaker:Target']"""
        if not content or not current_speaker:
            return []

        matches = self.request_pattern.findall(content)
        if not matches:
            return []

        requests = []
        for match in matches:
            if match in participants and match != current_speaker:
                requests.append(f"{current_speaker}:{match}")
        return requests

    def _extract_mentions(
        self,
        content: Optional[str],
        participants: List[str],
        current_speaker: Optional[str],
    ) -> List[str]:
        """Extract mentions from message content. Returns format ['Speaker:Mentioned']"""
        if not content or not current_speaker:
            return []

        matches = self.mention_pattern.findall(content)
        if not matches:
            return []

        mentions = []
        for match in matches:
            if match in participants and match != current_speaker:
                mentions.append(f"{current_speaker}:{match}")
        return mentions

    def _extract_preferred_target(
        self,
        content: Optional[str],
        participants: List[str],
        current_speaker: Optional[str],
    ) -> Optional[str]:
        """Identify the next preferred speaker based on @mentions in the latest message."""
        if not content:
            return None

        # Check requests first (higher priority)
        requests = self._extract_requests(content, participants, current_speaker)
        if requests:
            # Return the target from first request
            return requests[0].split(":")[1]

        # Then check mentions
        mentions = self._extract_mentions(content, participants, current_speaker)
        if mentions:
            # Return the target from first mention
            return mentions[0].split(":")[1]

        return None

    def _apply_preferred_speaker(
        self,
        state: ConversationState,
        content: Optional[str],
        current_speaker: Optional[str],
    ) -> ConversationState:
        """Update state with a preferred next speaker when one is mentioned explicitly."""
        participants = state.get("participants", [])

        # Extract requests and mentions
        requests = self._extract_requests(content, participants, current_speaker)
        mentions = self._extract_mentions(content, participants, current_speaker)

        # Add to state lists
        if requests:
            state["requests"] = state.get("requests", []) + requests
        if mentions:
            state["mentions"] = state.get("mentions", []) + mentions

        # Determine preferred target
        target = self._extract_preferred_target(content, participants, current_speaker)

        if target:
            state["preferred_next_speaker"] = target
            state["preferred_bias_remaining"] = 1

        return state

    def _clear_preferred_speaker(self, state: ConversationState) -> ConversationState:
        """Clear any stored preference for the next speaker."""
        state["preferred_next_speaker"] = None
        state["preferred_bias_remaining"] = 0
        return state

    def _fallback_round_robin_speaker(self, state: ConversationState) -> str:
        """Fallback: Determine next speaker using simple round-robin"""
        participants = state.get("participants", [])
        if not participants:
            return ""

        pointer = state.get("round_robin_pointer", 0) % len(participants)
        return participants[pointer]

    async def _turn_coordinator(self, state: ConversationState) -> ConversationState:
        """Use LLM to intelligently select next speaker"""
        participants = state.get("participants", [])
        if not participants:
            self.current_state = state
            return state

        messages = state.get("messages", [])
        topic = state.get("topic")
        last_speaker = state.get("current_speaker")

        try:
            # Create coordinator LLM
            coordinator_llm, system_prompt = create_coordinator_llm()

            # Prepare conversation history for coordinator
            history_messages = self._preprocess_messages_with_speakers(messages)

            # Build dynamic participant descriptions
            participant_descriptions = []
            for p_id in participants:
                try:
                    p_info = get_participant_info(p_id)
                    # Extract first line of system prompt as description
                    prompt_lines = p_info['system_prompt'].split('\n')
                    description = prompt_lines[0].replace(f"You are {p_id}, ", "").replace(".", "")
                    participant_descriptions.append(f"- {p_id}: {description}")
                except Exception as e:
                    logger.warning(f"Could not get info for participant {p_id}: {e}")
                    participant_descriptions.append(f"- {p_id}")

            # Add context about topic and participants
            participants_list = '\n'.join(participant_descriptions)
            context_message = f"Topic: {topic}\n\nAvailable participants:\n{participants_list}"
            if last_speaker:
                context_message += f"\n\nLast speaker: {last_speaker}"

            context_message += "\n\nWho should speak next?"

            # Add system prompt if not using Gemini
            if system_prompt:
                history_messages = [HumanMessage(content=system_prompt)] + history_messages

            history_messages.append(HumanMessage(content=context_message))

            # Get coordinator decision
            response = await coordinator_llm.ainvoke(history_messages)

            # Handle structured output (Pydantic) or JSON string
            if hasattr(response, 'next_speaker'):
                # Structured output (Pydantic object)
                chosen_speaker = response.next_speaker
                reasoning = response.reasoning
                logger.info(f"Coordinator decision: {chosen_speaker} - {reasoning}")
            else:
                # JSON string response
                response_text = self._coalesce_message_content(response)
                logger.info(f"Coordinator response: {response_text}")
                decision_data = json.loads(response_text)
                chosen_speaker = decision_data.get("next_speaker")
                reasoning = decision_data.get("reasoning", "No reasoning provided")

            # Validate speaker
            if chosen_speaker not in participants:
                logger.warning(f"Coordinator selected invalid participant '{chosen_speaker}', falling back to round-robin")
                chosen_speaker = self._fallback_round_robin_speaker(state)
                reasoning = f"Fallback: coordinator selected invalid participant"

            # Emit coordinator decision event
            await self._emit_event("turn_decision", {
                "next_speaker": chosen_speaker,
                "reasoning": reasoning,
                "turn": state.get("turn_count", 0)
            })

            # Update round-robin pointer for next fallback
            pointer = state.get("round_robin_pointer", 0)
            next_pointer = (pointer + 1) % len(participants)

            updated_state = {
                **state,
                "current_speaker": chosen_speaker,
                "round_robin_pointer": next_pointer,
            }

            self.current_state = updated_state
            return updated_state

        except Exception as e:
            logger.error(f"Error in turn coordinator: {e}, falling back to round-robin")

            # Fallback to round-robin
            chosen_speaker = self._fallback_round_robin_speaker(state)

            await self._emit_event("turn_decision", {
                "next_speaker": chosen_speaker,
                "reasoning": f"Fallback: coordinator error - {str(e)}",
                "turn": state.get("turn_count", 0)
            })

            pointer = state.get("round_robin_pointer", 0)
            next_pointer = (pointer + 1) % len(participants)

            updated_state = {
                **state,
                "current_speaker": chosen_speaker,
                "round_robin_pointer": next_pointer,
            }

            self.current_state = updated_state
            return updated_state

    def _extract_chunk_text(self, chunk: Any) -> str:
        """Normalize streamed chunk payloads across providers into plain text."""
        # Most LangChain chunks expose `.content`; handle strings and structured lists
        content = getattr(chunk, "content", None)
        if isinstance(content, str) and content:
            return content

        if isinstance(content, list):
            pieces: List[str] = []
            for part in content:
                if isinstance(part, str):
                    pieces.append(part)
                elif isinstance(part, dict):
                    text_value = part.get("text") or part.get("content")
                    if isinstance(text_value, str):
                        pieces.append(text_value)
            if pieces:
                return "".join(pieces)

        # Gemini chunks often populate `.text`
        text_attr = getattr(chunk, "text", None)
        if isinstance(text_attr, str) and text_attr:
            return text_attr

        # Some providers use `.delta`
        delta = getattr(chunk, "delta", None)
        if isinstance(delta, dict):
            delta_text = delta.get("text") or delta.get("content")
            if isinstance(delta_text, str) and delta_text:
                return delta_text

        # Fall back to additional kwargs payloads
        additional = getattr(chunk, "additional_kwargs", None)
        if isinstance(additional, dict):
            direct = additional.get("text") or additional.get("content")
            if isinstance(direct, str) and direct:
                return direct
            if isinstance(direct, list):
                pieces = [p for p in direct if isinstance(p, str)]
                if pieces:
                    return "".join(pieces)

            candidates = additional.get("candidates")
            if isinstance(candidates, list):
                candidate_pieces: List[str] = []
                for candidate in candidates:
                    if not isinstance(candidate, dict):
                        continue
                    content_block = candidate.get("content")
                    if isinstance(content_block, dict):
                        parts = content_block.get("parts")
                        if isinstance(parts, list):
                            for part in parts:
                                if isinstance(part, dict):
                                    text_value = part.get("text") or part.get("content")
                                    if isinstance(text_value, str):
                                        candidate_pieces.append(text_value)
                    text_snippet = candidate.get("text")
                    if isinstance(text_snippet, str):
                        candidate_pieces.append(text_snippet)
                if candidate_pieces:
                    return "".join(candidate_pieces)

            parts = additional.get("parts")
            if isinstance(parts, list):
                pieces: List[str] = []
                for part in parts:
                    if isinstance(part, dict):
                        text_value = part.get("text") or part.get("content")
                        if isinstance(text_value, str):
                            pieces.append(text_value)
                if pieces:
                    return "".join(pieces)

        return ""

    def _coalesce_message_content(self, message: Any) -> str:
        """Extract text content from a final AIMessage result."""
        content = getattr(message, "content", None)
        if isinstance(content, str) and content:
            return content
        if isinstance(content, list):
            pieces: List[str] = []
            for entry in content:
                if isinstance(entry, str):
                    pieces.append(entry)
                elif isinstance(entry, dict):
                    text_value = entry.get("text") or entry.get("content")
                    if isinstance(text_value, str):
                        pieces.append(text_value)
            if pieces:
                return "".join(pieces)

        additional = getattr(message, "additional_kwargs", None)
        if isinstance(additional, dict):
            direct = additional.get("text") or additional.get("content")
            if isinstance(direct, str) and direct:
                return direct
            if isinstance(direct, list):
                pieces = [p for p in direct if isinstance(p, str)]
                if pieces:
                    return "".join(pieces)

            candidates = additional.get("candidates")
            if isinstance(candidates, list):
                candidate_pieces: List[str] = []
                for candidate in candidates:
                    if not isinstance(candidate, dict):
                        continue
                    text_snippet = candidate.get("text")
                    if isinstance(text_snippet, str):
                        candidate_pieces.append(text_snippet)
                    content_block = candidate.get("content")
                    if isinstance(content_block, dict):
                        parts = content_block.get("parts")
                        if isinstance(parts, list):
                            for part in parts:
                                if isinstance(part, dict):
                                    text_value = part.get("text") or part.get("content")
                                    if isinstance(text_value, str):
                                        candidate_pieces.append(text_value)
                if candidate_pieces:
                    return "".join(candidate_pieces)

        return ""

    async def _wait_for_human_input(self, state: ConversationState) -> ConversationState:
        """Wait for human to provide input via inject endpoint"""
        logger.info("Waiting for human input...")

        # Clear the event before waiting
        self.human_input_event.clear()

        # Wait indefinitely for human input (no timeout per requirements)
        await self.human_input_event.wait()

        logger.info(f"Human input received: {self.pending_human_message}")

        # Add human message to state
        if self.pending_human_message:
            human_message = AIMessage(  # Use AIMessage to match participant pattern
                content=self.pending_human_message,
                additional_kwargs={"participant": "Human"}
            )

            updated_state: ConversationState = {
                **state,
                "messages": state["messages"] + [human_message],
                "turn_count": state.get("turn_count", 0) + 1
            }

            # Track requests and mentions from human message
            updated_state = self._apply_preferred_speaker(
                updated_state,
                self.pending_human_message,
                "Human"
            )

            # Clear pending message
            self.pending_human_message = None
            self.current_state = updated_state

            return updated_state

        return state

    def _preprocess_messages_with_speakers(self, messages: List[BaseMessage]) -> List[BaseMessage]:
        """Add speaker attribution to message content for LLM context using <message> wrapper"""
        processed_messages = []

        for msg in messages:
            # Extract participant name from additional_kwargs
            participant = "System"
            if hasattr(msg, "additional_kwargs") and isinstance(msg.additional_kwargs, dict):
                participant = msg.additional_kwargs.get("participant", "System")
            elif isinstance(msg, HumanMessage):
                participant = "System"

            # Get the content
            content = msg.content if isinstance(msg.content, str) else str(msg.content)

            # Create new message with <message from="Name">content</message> format
            attributed_content = f'<message from="{participant}">{content}</message>'

            if isinstance(msg, HumanMessage):
                new_msg = HumanMessage(
                    content=attributed_content,
                    additional_kwargs=msg.additional_kwargs if hasattr(msg, "additional_kwargs") else {}
                )
            else:  # AIMessage
                new_msg = AIMessage(
                    content=attributed_content,
                    additional_kwargs=msg.additional_kwargs if hasattr(msg, "additional_kwargs") else {}
                )

            processed_messages.append(new_msg)

        return processed_messages

    async def _generate_ai_response(self, state: ConversationState) -> ConversationState:
        """Generate AI response for current speaker"""
        # Early exit if conversation was stopped
        if not state.get("conversation_active", True):
            logger.info("Conversation stopped, skipping AI response generation")
            return state

        current_speaker = state["current_speaker"]
        messages = state["messages"]

        # Handle Human participant - wait for user input
        if current_speaker == "Human":
            await self._emit_event("human_input_requested", {
                "participant": "Human",
                "turn": state.get("turn_count", 0)
            })
            return await self._wait_for_human_input(state)

        try:
            # Get participant configuration
            participant_info = get_participant_info(current_speaker)
            llm, system_prompt = create_participant_llm(current_speaker)

            await self._emit_event("ai_thinking_start", {
                "participant": current_speaker,
                "model": participant_info["model"]
            })

            # Preprocess messages to add speaker attribution
            conversation_messages = self._preprocess_messages_with_speakers(messages)

            # Prepare messages with system prompt (only for providers that need it in messages)
            if system_prompt:
                # OpenAI and Anthropic: Add system prompt as first message
                conversation_messages = [HumanMessage(content=system_prompt)] + conversation_messages

            # Add topic context if this is early in conversation
            if state.get("topic") and len(messages) < 2:
                topic_message = HumanMessage(content=f"Topic for discussion: {state['topic']}")
                conversation_messages.append(topic_message)

            # Generate streaming response
            await self._emit_event("ai_response_start", {
                "participant": current_speaker
            })

            response_content = ""
            thinking_content = ""
            chunk_count = 0
            final_usage_metadata = None  # Accumulate usage metadata

            async for chunk in llm.astream(conversation_messages):
                chunk_count += 1

                # Log comprehensive chunk metadata for analysis
                chunk_metadata = {
                    "participant": current_speaker,
                    "chunk_number": chunk_count,
                    "chunk_type": type(chunk).__name__,
                    "has_content": bool(getattr(chunk, 'content', None)),
                    "content_length": len(getattr(chunk, 'content', '')) if hasattr(chunk, 'content') else 0,
                }

                # Capture all available metadata fields
                if hasattr(chunk, 'response_metadata') and chunk.response_metadata:
                    chunk_metadata['response_metadata'] = chunk.response_metadata

                if hasattr(chunk, 'additional_kwargs') and chunk.additional_kwargs:
                    chunk_metadata['additional_kwargs'] = chunk.additional_kwargs

                if hasattr(chunk, 'usage_metadata') and chunk.usage_metadata:
                    chunk_metadata['usage_metadata'] = chunk.usage_metadata
                    # Capture the final usage metadata (last chunk typically has complete stats)
                    final_usage_metadata = chunk.usage_metadata

                if hasattr(chunk, 'tool_calls'):
                    chunk_metadata['has_tool_calls'] = bool(chunk.tool_calls)

                if hasattr(chunk, 'tool_call_chunks'):
                    chunk_metadata['has_tool_call_chunks'] = bool(chunk.tool_call_chunks)

                logger.info(f"[STREAM_ANALYSIS] {json.dumps(chunk_metadata, default=str)}")

                # Detect thinking/reasoning tokens (Gemini 2.0+)
                has_reasoning = False
                if hasattr(chunk, 'usage_metadata') and chunk.usage_metadata:
                    output_details = chunk.usage_metadata.get('output_token_details', {})
                    reasoning_tokens = output_details.get('reasoning', 0)
                    if reasoning_tokens > 0:
                        has_reasoning = True
                        logger.info(f"{current_speaker} reasoning: {reasoning_tokens} tokens")

                chunk_text = self._extract_chunk_text(chunk)
                if not chunk_text:
                    # Empty chunks are normal at end of stream
                    continue

                # Gemini includes reasoning metadata even for output chunks
                # Skip only whitespace-only chunks that have reasoning tokens
                if has_reasoning and not chunk_text.strip():
                    # Skip whitespace-only chunks during reasoning
                    continue

                # All other chunks are normal output
                response_content += chunk_text
                await self._emit_event("ai_response_stream", {
                    "participant": current_speaker,
                    "content": chunk_text,
                    "full_content": response_content
                })

            logger.info(f"{current_speaker} streaming complete: {chunk_count} chunks, {len(response_content)} chars output, {len(thinking_content)} chars thinking")

            if not response_content:
                fallback_message = await llm.ainvoke(conversation_messages)
                fallback_text = self._coalesce_message_content(fallback_message)
                if fallback_text:
                    response_content = fallback_text
                    await self._emit_event("ai_response_stream", {
                        "participant": current_speaker,
                        "content": fallback_text,
                        "full_content": response_content
                    })

            # Create final message with usage metadata
            message_kwargs = {"participant": current_speaker}
            if final_usage_metadata:
                message_kwargs["usage_metadata"] = final_usage_metadata

            ai_message = AIMessage(
                content=response_content,
                additional_kwargs=message_kwargs
            )

            await self._emit_event("ai_response_complete", {
                "participant": current_speaker,
                "content": response_content,
                "usage_metadata": final_usage_metadata
            })

            updated_state: ConversationState = {
                **state,
                "messages": messages + [ai_message],
                "turn_count": state.get("turn_count", 0) + 1
            }

            updated_state = self._apply_preferred_speaker(
                updated_state,
                response_content,
                current_speaker,
            )

            self.current_state = updated_state

            return updated_state

        except Exception as e:
            logger.error(f"Error generating AI response for {current_speaker}: {e}")
            await self._emit_event("ai_response_error", {
                "participant": current_speaker,
                "error": str(e),
                "turn": state.get("turn_count", 0)
            })

            # Add error recovery: create an error message to keep conversation flowing
            error_message = AIMessage(
                content=f"[{current_speaker} encountered an error and cannot respond at this time]",
                additional_kwargs={"participant": current_speaker, "error": True}
            )

            # Still increment turn count to prevent getting stuck
            fallback_state: ConversationState = {
                **state,
                "messages": messages + [error_message],
                "turn_count": state.get("turn_count", 0) + 1
            }

            self.current_state = fallback_state

            return fallback_state

    async def _check_human_input(self, state: ConversationState) -> ConversationState:
        """Check if human wants to interject"""
        # For MVP, we'll implement a simple mechanism
        # In a real implementation, this would check for pending human input
        return {
            **state,
            "human_input_pending": False
        }

    async def _check_pause_status(self, state: ConversationState) -> ConversationState:
        """Check if conversation is paused"""
        if state.get("conversation_paused", False):
            await self._emit_event("conversation_paused", {
                "message": "Conversation is paused - waiting for resume"
            })

            # Wait for resume with timeout to prevent infinite waiting
            max_wait_time = 300  # 5 minutes max
            wait_start = asyncio.get_event_loop().time()

            while (state.get("conversation_paused", False) and
                   (asyncio.get_event_loop().time() - wait_start) < max_wait_time):
                await asyncio.sleep(0.5)  # Check every 500ms

                # Update state from current instance to get real-time status
                if self.current_state:
                    state.update(self.current_state)

            if state.get("conversation_paused", False):
                # Still paused after timeout - end conversation
                await self._emit_event("conversation_timeout", {
                    "message": "Conversation auto-ended due to extended pause"
                })
                state["conversation_active"] = False
            else:
                await self._emit_event("conversation_resumed", {
                    "message": "Conversation resumed"
                })

        return state

    def _route_after_pause_check(self, state: ConversationState):
        """Route after checking pause status"""
        if state.get("conversation_paused", False):
            return "pause_check"  # Stay in pause check until resumed
        elif not state.get("conversation_active", True):
            return END  # Stop conversation if inactive
        else:
            return "ai_response"

    def _route_after_human_check(self, state: ConversationState):
        """Route based on human input status and conversation state"""
        if state.get("human_input_pending", False):
            return "human_input"  # Future implementation
        elif state.get("turn_count", 0) >= 15:  # Limit for demo
            return END
        elif not state.get("conversation_active", True):
            return END
        else:
            return "end_turn"

    async def _end_turn(self, state: ConversationState) -> ConversationState:
        """End current turn and prepare for next"""
        await self._emit_event("turn_complete", {
            "turn": state.get("turn_count", 0),
            "total_messages": len(state["messages"])
        })
        return state

    async def start_conversation(self, topic: str, participants: List[str] = None, conversation_id: Optional[str] = None):
        """Start a new conversation with given topic"""
        if participants is None:
            participants = ["Human", "Alice", "Bob", "Charlie"]

        # Generate conversation ID if not provided
        if conversation_id is None:
            conversation_id = str(uuid.uuid4())

        initial_state = ConversationState(
            messages=[],
            participants=participants,
            current_speaker="",
            turn_count=0,
            conversation_active=True,
            human_input_pending=False,
            conversation_paused=False,
            topic=topic,
            preferred_next_speaker=None,
            preferred_bias_remaining=0,
            round_robin_pointer=0,
            requests=[],
            mentions=[]
        )

        # Store current state for pause/resume control
        self.current_state = initial_state
        self.current_participants = participants
        self.current_topic = topic
        self.current_conversation_id = conversation_id
        self.conversation_started_at = datetime.now(timezone.utc)

        await self._emit_event("conversation_start", {
            "conversation_id": conversation_id,
            "topic": topic,
            "participants": participants
        })

        # Add initial topic message from Human
        topic_message = HumanMessage(
            content=f"Let's discuss: {topic}",
            additional_kwargs={"participant": "Human"}
        )
        initial_state["messages"] = [topic_message]

        # Emit event for initial topic message so frontend displays it
        await self._emit_event("human_message_added", {
            "participant": "Human",
            "content": f"Let's discuss: {topic}"
        })

        # Run the graph
        async for event in self.graph.astream(initial_state):
            # LangGraph will emit updates as the conversation progresses
            logger.info(f"Graph event: {event}")

    async def add_human_message(self, content: str, state: ConversationState) -> ConversationState:
        """Add human message to conversation"""
        human_message = HumanMessage(content=content)

        await self._emit_event("human_message_added", {
            "content": content
        })

        updated_state: ConversationState = {
            **state,
            "messages": state["messages"] + [human_message]
        }

        updated_state = self._apply_preferred_speaker(
            updated_state,
            content,
            "Human",
        )

        self.current_state = updated_state

        return updated_state

    def pause_conversation(self) -> bool:
        """Pause the active conversation"""
        if self.current_state:
            self.current_state["conversation_paused"] = True
            return True
        return False

    def resume_conversation(self) -> bool:
        """Resume the paused conversation"""
        if self.current_state:
            self.current_state["conversation_paused"] = False
            return True
        return False

    def is_paused(self) -> bool:
        """Check if conversation is currently paused"""
        if self.current_state:
            return self.current_state.get("conversation_paused", False)
        return False

    def is_active(self) -> bool:
        """Check if conversation is currently active"""
        if self.current_state:
            return self.current_state.get("conversation_active", False)
        return False

    async def stop_conversation(self, reason: str = "Conversation stopped by operator") -> bool:
        """Gracefully end the active conversation"""
        if not self.current_state:
            return False

        self.current_state["conversation_active"] = False
        self.current_state["conversation_paused"] = False

        ended_at = datetime.now(timezone.utc)
        started_at = self.conversation_started_at
        duration_seconds = None
        if started_at:
            duration_seconds = int((ended_at - started_at).total_seconds())

        await self._emit_event("conversation_end", {
            "message": reason,
            "participants": self.current_participants,
            "topic": self.current_topic,
            "started_at": started_at.isoformat() if started_at else None,
            "ended_at": ended_at.isoformat(),
            "duration_seconds": duration_seconds,
        })

        await self._emit_event("conversation_status", {
            "active": False,
            "paused": False,
            "participants": self.current_participants,
            "topic": self.current_topic,
        })

        return True

    def clear_state(self) -> None:
        """Reset runtime state after a conversation fully stops"""
        self.current_state = None
        self.current_participants = []
        self.current_topic = None
        self.current_conversation_id = None
        self.conversation_started_at = None

    def get_conversation_snapshot(self) -> Optional[Dict[str, Any]]:
        """Get a snapshot of the current conversation for reconnection"""
        if not self.current_state:
            return None

        return {
            "conversation_id": self.current_conversation_id,
            "topic": self.current_topic,
            "participants": self.current_participants,
            "active": self.is_active(),
            "paused": self.is_paused(),
            "turn_count": self.current_state.get("turn_count", 0),
            "message_count": len(self.current_state.get("messages", [])),
            "started_at": self.conversation_started_at.isoformat() if self.conversation_started_at else None,
            "messages": [
                {
                    "content": msg.content,
                    "participant": msg.additional_kwargs.get("participant", "System") if hasattr(msg, "additional_kwargs") else ("System" if isinstance(msg, HumanMessage) else "AI"),
                    "type": "human" if isinstance(msg, HumanMessage) else "ai"
                }
                for msg in self.current_state.get("messages", [])
            ]
        }

    def add_human_message_to_state(self, content: str) -> bool:
        """Add human message directly to current conversation state"""
        if self.current_state:
            human_message = HumanMessage(
                content=content,
                additional_kwargs={"participant": "Human"}
            )

            # Add to messages in current state
            self.current_state["messages"].append(human_message)

            # Set flag to indicate human input was added
            self.current_state["human_input_pending"] = False

            self._apply_preferred_speaker(
                self.current_state,
                content,
                "Human",
            )

            return True
        return False

# Global instance for the application
conversation_graph = ConversationGraph()
