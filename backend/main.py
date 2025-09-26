from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
import asyncio
import json
import logging
import os
from dotenv import load_dotenv
from conversation_graph import conversation_graph
from adapter import conversation_streamer
from storage import transcript_store

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Conversaition API", version="0.1.0")

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Conversaition API", "status": "running"}

# Pydantic models
class StartConversationRequest(BaseModel):
    topic: str
    participants: list[str] = ["Alice", "Bob", "Charlie"]

class AddMessageRequest(BaseModel):
    content: str

# Global conversation state
active_conversation = None
conversation_task = None

@app.post("/conversation/start")
async def start_conversation(request: StartConversationRequest):
    """Start a new multi-AI conversation"""
    global active_conversation, conversation_task

    try:
        logger.info(f"Starting conversation with topic: {request.topic}")

        # Set up event callback to connect LangGraph to the streamer
        async def handle_conversation_event(event):
            await conversation_streamer.handle_langgraph_event(event)

        conversation_graph.add_event_callback(handle_conversation_event)

        # Start conversation in background task
        conversation_task = asyncio.create_task(
            conversation_graph.start_conversation(request.topic, request.participants)
        )

        # Broadcast conversation started status event
        await conversation_streamer.handle_langgraph_event({
            "type": "conversation_status",
            "data": {
                "active": True,
                "paused": False,
                "participants": request.participants,
                "topic": request.topic
            }
        })

        return {
            "status": "started",
            "topic": request.topic,
            "participants": request.participants
        }

    except Exception as e:
        logger.error(f"Error starting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversation/stream")
async def stream_conversation():
    """
    Stream conversation events to frontend using AI SDK compatible format
    """
    try:
        # Create client queue
        client_queue = asyncio.Queue()
        conversation_streamer.add_client(client_queue)

        logger.info("New SSE client connected")

        # Return SSE stream
        return EventSourceResponse(
            conversation_streamer.generate_sse_stream(client_queue),
            media_type="text/event-stream"
        )

    except Exception as e:
        logger.error(f"Error in conversation stream: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/conversation/message")
async def add_human_message(request: AddMessageRequest):
    """Add human message to active conversation"""
    try:
        # Check if conversation is active
        if not conversation_graph.is_active():
            raise HTTPException(status_code=400, detail="No active conversation")

        logger.info(f"Human message: {request.content}")

        # Add human message to conversation state
        success = conversation_graph.add_human_message_to_state(request.content)

        if success:
            # Broadcast human message event
            await conversation_streamer.handle_langgraph_event({
                "type": "human_message_added",
                "data": {
                    "content": request.content,
                    "participant": "Human",
                    "timestamp": asyncio.get_event_loop().time()
                }
            })

            return {"status": "added", "content": request.content}
        else:
            raise HTTPException(status_code=400, detail="Failed to add message to conversation")

    except Exception as e:
        logger.error(f"Error adding human message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/conversation/pause")
async def pause_conversation():
    """Pause the active conversation"""
    try:
        success = conversation_graph.pause_conversation()
        if success:
            # Broadcast pause event
            await conversation_streamer.handle_langgraph_event({
                "type": "conversation_paused",
                "data": {"message": "Conversation paused"}
            })
            # Broadcast status change event
            await conversation_streamer.handle_langgraph_event({
                "type": "conversation_status",
                "data": {
                    "active": True,
                    "paused": True,
                    "participants": conversation_graph.current_participants or ["Alice", "Bob", "Charlie"],
                    "topic": conversation_graph.current_topic or "Active conversation"
                }
            })
            return {"status": "paused", "message": "Conversation has been paused"}
        else:
            raise HTTPException(status_code=400, detail="No active conversation to pause")
    except Exception as e:
        logger.error(f"Error pausing conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/conversation/resume")
async def resume_conversation():
    """Resume the paused conversation"""
    try:
        success = conversation_graph.resume_conversation()
        if success:
            # Broadcast resume event
            await conversation_streamer.handle_langgraph_event({
                "type": "conversation_resumed",
                "data": {"message": "Conversation resumed"}
            })
            # Broadcast status change event
            await conversation_streamer.handle_langgraph_event({
                "type": "conversation_status",
                "data": {
                    "active": True,
                    "paused": False,
                    "participants": conversation_graph.current_participants or ["Alice", "Bob", "Charlie"],
                    "topic": conversation_graph.current_topic or "Active conversation"
                }
            })
            return {"status": "resumed", "message": "Conversation has been resumed"}
        else:
            raise HTTPException(status_code=400, detail="No paused conversation to resume")
    except Exception as e:
        logger.error(f"Error resuming conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/conversation/stop")
async def stop_conversation():
    """Stop the active conversation and clean up resources"""
    global conversation_task

    if not conversation_graph.is_active() and not conversation_graph.is_paused():
        raise HTTPException(status_code=400, detail="No active conversation to stop")

    try:
        snapshot_state = conversation_graph.current_state
        participants_snapshot = list(conversation_graph.current_participants)
        topic_snapshot = conversation_graph.current_topic

        stopped = await conversation_graph.stop_conversation()
        if not stopped:
            raise HTTPException(status_code=400, detail="No active conversation to stop")

        # Cancel the running LangGraph task if it is still active
        if conversation_task and not conversation_task.done():
            conversation_task.cancel()
            try:
                await conversation_task
            except asyncio.CancelledError:
                logger.info("Conversation task cancelled successfully")

        if snapshot_state:
            transcript_store.persist(
                topic=topic_snapshot,
                participants=participants_snapshot,
                messages=snapshot_state.get("messages", []),
            )

        conversation_task = None
        conversation_graph.clear_state()

        return {"status": "stopped", "message": "Conversation has been stopped"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error stopping conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversation/status")
async def get_conversation_status():
    """Get current conversation status"""
    try:
        return {
            "active": conversation_graph.is_active(),
            "paused": conversation_graph.is_paused()
        }
    except Exception as e:
        logger.error(f"Error getting conversation status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Backend is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
