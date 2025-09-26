import unittest

SKIP_REASON = None

try:
    from backend.conversation_graph import ConversationGraph, ConversationState
except ModuleNotFoundError as exc:  # pragma: no cover - executed only when deps missing
    ConversationGraph = None  # type: ignore
    ConversationState = dict  # type: ignore
    SKIP_REASON = f"Required dependency missing: {exc}"


@unittest.skipIf(ConversationGraph is None, SKIP_REASON or "ConversationGraph unavailable")
class ConversationGraphTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.graph = ConversationGraph()
        self.emitted_events = []

        async def recorder(event):
            self.emitted_events.append(event)

        self.graph.add_event_callback(recorder)

    async def test_preferred_speaker_is_respected(self):
        state: ConversationState = {
            "messages": [],
            "participants": ["Alice", "Bob", "Charlie"],
            "current_speaker": "Alice",
            "turn_count": 1,
            "conversation_active": True,
            "human_input_pending": False,
            "conversation_paused": False,
            "topic": "AI Ethics",
            "preferred_next_speaker": None,
            "preferred_bias_remaining": 0,
            "round_robin_pointer": 1,
        }

        updated_state = self.graph._apply_preferred_speaker(
            state.copy(),
            "I would love to hear from @Charlie on this",
            "Alice",
        )

        scheduled_state = await self.graph._schedule_next_speaker(updated_state)

        self.assertEqual(scheduled_state["current_speaker"], "Charlie")
        self.assertIsNone(scheduled_state["preferred_next_speaker"])
        self.assertEqual(scheduled_state["preferred_bias_remaining"], 0)
        self.assertTrue(any(event["type"] == "speaker_scheduled" for event in self.emitted_events))

    async def test_stop_conversation_emits_events_and_clears_state(self):
        state: ConversationState = {
            "messages": [],
            "participants": ["Alice", "Bob"],
            "current_speaker": "Alice",
            "turn_count": 2,
            "conversation_active": True,
            "human_input_pending": False,
            "conversation_paused": False,
            "topic": "Future of AI",
            "preferred_next_speaker": None,
            "preferred_bias_remaining": 0,
            "round_robin_pointer": 0,
        }

        self.graph.current_state = state
        self.graph.current_participants = state["participants"]
        self.graph.current_topic = state["topic"]

        stopped = await self.graph.stop_conversation("Test stop")

        self.assertTrue(stopped)
        event_types = [event["type"] for event in self.emitted_events]
        self.assertIn("conversation_end", event_types)
        self.assertIn("conversation_status", event_types)

        self.graph.clear_state()

        self.assertIsNone(self.graph.current_state)
        self.assertEqual(self.graph.current_participants, [])
        self.assertIsNone(self.graph.current_topic)


if __name__ == "__main__":
    unittest.main()
