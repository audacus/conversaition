from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
import asyncio
import json

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

@app.get("/stream")
async def stream_events():
    """
    Minimal SSE endpoint that simulates AI SDK compatible events
    """
    async def event_generator():
        # Start event
        yield {
            "event": "message",
            "data": json.dumps({
                "type": "text-start",
                "data": {}
            })
        }

        # Simulate streaming text chunks (like AI response)
        message_parts = ["Hello", " from", " the", " backend!", " This", " is", " streaming", " text."]

        for part in message_parts:
            event = {
                "type": "text-delta",
                "data": {"textDelta": part}
            }
            yield {
                "event": "message",
                "data": json.dumps(event)
            }
            await asyncio.sleep(0.5)  # Simulate realistic streaming delay

        # End event
        yield {
            "event": "message",
            "data": json.dumps({
                "type": "text-done",
                "data": {}
            })
        }

    return EventSourceResponse(event_generator())

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Backend is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)