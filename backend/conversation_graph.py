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
from participants import create_participant_llm, get_participant_info
import logging

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

class ConversationGraph:
    def __init__(self):
        self.graph = self._build_graph()
        self.event_callbacks = []
        self.current_state = None

    def _build_graph(self):
        """Build the LangGraph conversation flow"""
        graph = StateGraph(ConversationState)

        # Core nodes
        graph.add_node("scheduler", self._schedule_next_speaker)
        graph.add_node("pause_check", self._check_pause_status)
        graph.add_node("ai_response", self._generate_ai_response)
        graph.add_node("human_check", self._check_human_input)
        graph.add_node("end_turn", self._end_turn)

        # Define flow
        graph.set_entry_point("scheduler")
        graph.add_edge("scheduler", "pause_check")
        graph.add_conditional_edges("pause_check", self._route_after_pause_check)
        graph.add_edge("ai_response", "human_check")
        graph.add_conditional_edges("human_check", self._route_after_human_check)
        graph.add_edge("end_turn", "scheduler")

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

    async def _schedule_next_speaker(self, state: ConversationState) -> ConversationState:
        """Determine next AI participant using round-robin"""
        participants = state["participants"]
        current_turn = state.get("turn_count", 0)

        # Simple round-robin for MVP
        next_speaker = participants[current_turn % len(participants)]

        await self._emit_event("speaker_scheduled", {
            "next_speaker": next_speaker,
            "turn": current_turn
        })

        return {
            **state,
            "current_speaker": next_speaker
        }

    async def _generate_ai_response(self, state: ConversationState) -> ConversationState:
        """Generate AI response for current speaker"""
        current_speaker = state["current_speaker"]
        messages = state["messages"]

        try:
            # Get participant configuration
            participant_info = get_participant_info(current_speaker)
            llm = create_participant_llm(current_speaker)

            await self._emit_event("ai_thinking_start", {
                "participant": current_speaker,
                "model": participant_info["model"]
            })

            # Prepare messages with system prompt
            conversation_messages = [
                HumanMessage(content=participant_info["system_prompt"])
            ] + messages

            # Add topic context if this is early in conversation
            if state.get("topic") and len(messages) < 2:
                topic_message = HumanMessage(content=f"Topic for discussion: {state['topic']}")
                conversation_messages.append(topic_message)

            # Generate streaming response
            await self._emit_event("ai_response_start", {
                "participant": current_speaker
            })

            response_content = ""
            async for chunk in llm.astream(conversation_messages):
                if chunk.content:
                    response_content += chunk.content
                    await self._emit_event("ai_response_stream", {
                        "participant": current_speaker,
                        "content": chunk.content,
                        "full_content": response_content
                    })

            # Create final message
            ai_message = AIMessage(
                content=response_content,
                additional_kwargs={"participant": current_speaker}
            )

            await self._emit_event("ai_response_complete", {
                "participant": current_speaker,
                "content": response_content
            })

            return {
                **state,
                "messages": messages + [ai_message],
                "turn_count": state.get("turn_count", 0) + 1
            }

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
            return {
                **state,
                "messages": messages + [error_message],
                "turn_count": state.get("turn_count", 0) + 1
            }

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

    async def start_conversation(self, topic: str, participants: List[str] = None):
        """Start a new conversation with given topic"""
        if participants is None:
            participants = ["Alice", "Bob", "Charlie"]

        initial_state = ConversationState(
            messages=[],
            participants=participants,
            current_speaker="",
            turn_count=0,
            conversation_active=True,
            human_input_pending=False,
            conversation_paused=False,
            topic=topic
        )

        # Store current state for pause/resume control
        self.current_state = initial_state

        await self._emit_event("conversation_start", {
            "topic": topic,
            "participants": participants
        })

        # Add initial topic message
        topic_message = HumanMessage(content=f"Let's discuss: {topic}")
        initial_state["messages"] = [topic_message]

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

        return {
            **state,
            "messages": state["messages"] + [human_message]
        }

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

            return True
        return False

# Global instance for the application
conversation_graph = ConversationGraph()