# Conversaition API Reference

Complete REST API documentation for the Conversaition backend.

**Base URL**: `http://localhost:8000`

## Table of Contents
- [Conversation Management](#conversation-management)
- [Participants Management](#participants-management)
- [Analytics](#analytics)
- [Health & Status](#health--status)
- [Event Streaming (SSE)](#event-streaming-sse)

## Conversation Management

### Start Conversation
Start a new multi-AI conversation.

```http
POST /conversation/start
Content-Type: application/json

{
  "topic": "string",
  "maxTurns": 10
}
```

**Response** (200):
```json
{
  "status": "started",
  "conversation_id": "uuid",
  "participants": ["Alice", "Bob", "Charlie"]
}
```

---

### Pause Conversation
Pause the active conversation.

```http
POST /conversation/pause
```

**Response** (200):
```json
{
  "status": "paused",
  "conversation_id": "uuid"
}
```

---

### Resume Conversation
Resume a paused conversation.

```http
POST /conversation/resume
```

**Response** (200):
```json
{
  "status": "resumed",
  "conversation_id": "uuid"
}
```

---

### Stop Conversation
Stop the conversation and save transcript.

```http
POST /conversation/stop
```

**Response** (200):
```json
{
  "status": "stopped",
  "conversation_id": "uuid",
  "transcript_id": "uuid",
  "transcript_path": "data/transcripts/conversation_timestamp.json"
}
```

---

### Inject Human Message
Inject a human message into the active conversation.

```http
POST /conversation/message
Content-Type: application/json

{
  "content": "string"
}
```

**Response** (200):
```json
{
  "status": "message_injected",
  "message": {
    "role": "human",
    "content": "string"
  }
}
```

---

### Get Conversation Status
Get the current conversation state.

```http
GET /conversation/status
```

**Response** (200):
```json
{
  "status": "active" | "paused" | "idle" | "error",
  "conversation_id": "uuid",
  "current_turn": 5,
  "max_turns": 10,
  "participants": ["Alice", "Bob", "Charlie"],
  "error": "string (if status is error)"
}
```

---

### Stream Conversation (SSE)
Subscribe to real-time conversation events via Server-Sent Events.

```http
GET /conversation/stream
Accept: text/event-stream
```

**Event Types**:
- `status` - Conversation status updates
- `message` - AI participant messages
- `thinking` - AI thinking status
- `error` - Error events

**Example Events**:
```
event: status
data: {"status": "active", "conversation_id": "uuid"}

event: thinking
data: {"participant": "Alice", "thinking": true}

event: message
data: {"participant": "Alice", "content": "...", "timestamp": "..."}

event: status
data: {"status": "idle"}
```

See [Event Streaming](#event-streaming-sse) section for details.

---

## Participants Management

### List All Participants
Get all configured AI participants.

```http
GET /participants
```

**Response** (200):
```json
[
  {
    "id": "alice",
    "name": "Alice",
    "provider": "openai",
    "model": "gpt-4.1-mini",
    "system_prompt": "You are Alice...",
    "temperature": 0.7,
    "max_tokens": 1000
  }
]
```

---

### Get Single Participant
Get details for a specific participant.

```http
GET /participants/{id}
```

**Response** (200):
```json
{
  "id": "alice",
  "name": "Alice",
  "provider": "openai",
  "model": "gpt-4.1-mini",
  "system_prompt": "You are Alice...",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Response** (404):
```json
{
  "detail": "Participant not found"
}
```

---

### Create Participant
Create a new AI participant.

```http
POST /participants
Content-Type: application/json

{
  "id": "david",
  "name": "David",
  "provider": "openai",
  "model": "gpt-4.1-mini",
  "system_prompt": "You are David...",
  "temperature": 0.8,
  "max_tokens": 1500
}
```

**Validation Rules**:
- `id`: Required, lowercase alphanumeric + hyphens/underscores
- `name`: Required, non-empty string
- `provider`: Required, one of: `openai`, `anthropic`, `gemini`
- `model`: Required, non-empty string
- `system_prompt`: Required, non-empty string
- `temperature`: Optional, 0.0-2.0 (default: 0.7)
- `max_tokens`: Optional, 1-100000 (default: 1000)

**Response** (200):
```json
{
  "id": "david",
  "name": "David",
  "provider": "openai",
  "model": "gpt-4.1-mini",
  "system_prompt": "You are David...",
  "temperature": 0.8,
  "max_tokens": 1500
}
```

**Response** (400):
```json
{
  "detail": "Validation error message"
}
```

---

### Update Participant
Update an existing participant.

```http
PUT /participants/{id}
Content-Type: application/json

{
  "name": "Alice Updated",
  "provider": "openai",
  "model": "gpt-4.1-mini",
  "system_prompt": "Updated prompt...",
  "temperature": 0.9,
  "max_tokens": 2000
}
```

**Notes**:
- Cannot change participant `id`
- Same validation rules as create

**Response** (200):
```json
{
  "id": "alice",
  "name": "Alice Updated",
  "provider": "openai",
  "model": "gpt-4.1-mini",
  "system_prompt": "Updated prompt...",
  "temperature": 0.9,
  "max_tokens": 2000
}
```

**Response** (404):
```json
{
  "detail": "Participant not found"
}
```

---

### Delete Participant
Delete a participant from the configuration.

```http
DELETE /participants/{id}
```

**Response** (200):
```json
{
  "message": "Participant deleted successfully"
}
```

**Response** (404):
```json
{
  "detail": "Participant not found"
}
```

**Response** (400):
```json
{
  "detail": "Cannot delete the last participant"
}
```

---

## Analytics

### List Transcripts
Get all saved conversation transcripts.

```http
GET /transcripts
```

**Response** (200):
```json
[
  {
    "id": "conversation_20250929_143052",
    "filename": "conversation_20250929_143052.json",
    "timestamp": "2025-09-29T14:30:52",
    "size_bytes": 12480
  }
]
```

---

### Get Transcript
Retrieve a specific conversation transcript.

```http
GET /transcripts/{id}
```

**Response** (200):
```json
{
  "conversation_id": "uuid",
  "started_at": "2025-09-29T14:30:52",
  "ended_at": "2025-09-29T14:35:12",
  "participants": ["Alice", "Bob", "Charlie"],
  "messages": [
    {
      "participant": "Alice",
      "content": "...",
      "timestamp": "2025-09-29T14:30:55"
    }
  ],
  "total_messages": 15,
  "duration_seconds": 260
}
```

**Response** (404):
```json
{
  "detail": "Transcript not found"
}
```

---

### Conversation Summary Analytics
Get analytics summary for all conversations.

```http
GET /analytics/conversations/summary
```

**Response** (200):
```json
{
  "total_conversations": 10,
  "total_messages": 150,
  "average_messages_per_conversation": 15.0,
  "participants": {
    "Alice": 50,
    "Bob": 52,
    "Charlie": 48
  },
  "date_range": {
    "earliest": "2025-09-20T10:00:00",
    "latest": "2025-09-29T14:35:12"
  }
}
```

---

## Health & Status

### API Root
Basic API information.

```http
GET /
```

**Response** (200):
```json
{
  "message": "Conversaition API - Multi-AI Conversation Platform",
  "version": "1.0.0",
  "status": "operational"
}
```

---

### Health Check
Service health status.

```http
GET /health
```

**Response** (200):
```json
{
  "status": "healthy",
  "timestamp": "2025-09-29T14:30:52Z"
}
```

---

## Event Streaming (SSE)

### Connection Setup
The conversation stream endpoint uses Server-Sent Events for real-time updates.

```javascript
const eventSource = new EventSource('http://localhost:8000/conversation/stream');

eventSource.addEventListener('status', (event) => {
  const data = JSON.parse(event.data);
  console.log('Status:', data);
});

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('Message:', data);
});

eventSource.addEventListener('thinking', (event) => {
  const data = JSON.parse(event.data);
  console.log('Thinking:', data);
});

eventSource.addEventListener('error', (event) => {
  const data = JSON.parse(event.data);
  console.error('Error:', data);
});
```

### Event Types

#### Status Event
Broadcast when conversation state changes.

```json
{
  "event": "status",
  "data": {
    "status": "active" | "paused" | "idle" | "error",
    "conversation_id": "uuid"
  }
}
```

#### Thinking Event
Broadcast when an AI participant starts/stops thinking.

```json
{
  "event": "thinking",
  "data": {
    "participant": "Alice",
    "thinking": true | false
  }
}
```

#### Message Event
Broadcast when an AI participant sends a message.

```json
{
  "event": "message",
  "data": {
    "participant": "Alice",
    "content": "Message content...",
    "timestamp": "2025-09-29T14:30:55Z"
  }
}
```

#### Error Event
Broadcast when an error occurs.

```json
{
  "event": "error",
  "data": {
    "error": "Error message",
    "details": "Additional context"
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Validation error or invalid request"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error",
  "error": "Error details"
}
```

---

## Rate Limiting

Currently no rate limiting is enforced. Future versions will implement:
- Per-IP rate limits
- Per-conversation message limits
- AI provider API quota management

---

## CORS Configuration

The API allows CORS from all origins (`*`) in development. Configure appropriately for production deployment.

---

## Authentication

Currently no authentication is required. Future versions will implement:
- JWT-based authentication
- API key management
- Role-based access control