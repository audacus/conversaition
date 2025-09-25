from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
import asyncio
import json
import logging
from conversation_graph import conversation_graph
from adapter import conversation_streamer

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
            media_type="text/plain"
        )

    except Exception as e:
        logger.error(f"Error in conversation stream: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/conversation/message")
async def add_human_message(request: AddMessageRequest):
    """Add human message to active conversation"""
    global active_conversation

    try:
        # For MVP, we'll implement this later
        # This would add human message to conversation state
        logger.info(f"Human message: {request.content}")

        # Broadcast human message event
        await conversation_streamer.handle_langgraph_event({
            "type": "human_message_added",
            "data": {"content": request.content}
        })

        return {"status": "added", "content": request.content}

    except Exception as e:
        logger.error(f"Error adding human message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Backend is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)