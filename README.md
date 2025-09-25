# conversaition

## Idea

"Bringing multiple AIs to the table for a conversation (with a human in the loop)."

## Functional Requirements

### Core Conversation Features
- Let multiple AIs and a human (user) talk together in real-time.
- All AIs see all messages from all participants and can refer to each other by name during conversations.
- The different AIs shall not interrupt each other, but wait for the "talking" AI to finish the current step.
- Use a weighted round-robin mechanism to ensure fair participation and prevent the fastest AI from dominating.
- Use LLM events (thinking, output start, output end, step start, step end, ...) to control the flow/order of the conversation.
- An AI should not try to respond to their own output, except when correcting or adding additional information.
- Conversations can start with manual user input or by tasking an AI participant to provide a conversation starter.

### AI Provider Support
- Support for multiple AI providers:
  - OpenAI (GPT models)
  - Anthropic (Claude models)
  - Google (Gemini models)
  - Local models (configurable base URL, port, model name)

### Participant Management
- Configure AIs that should be available as participants
- Save conversation participants in a reusable pool
- Configure participant settings:
  - System prompt (overriding default)
  - Temperature and other model parameters
  - Personality profiles and expertise roles
  - Weighted priority for round-robin scheduling

### Conversation Control
- Pause conversations to:
  - Alter existing messages (edit chat history)
  - Add manual messages to the conversation
  - Add/remove conversation participants (from pool or create new ones)
- Support conversation branching for parallel topic exploration
- Real-time conversation flow with live updates

### Advanced Features
- **Conversation Templates**: Pre-defined scenarios (debate, brainstorming, code review, etc.) with specific AI roles
- **File Uploads**: Allow participants to analyze shared files together
- **Tool Integration**:
  - Code execution environment for programming discussions
  - Web search capabilities for fact-checking and research
- **Conversation Analytics**: Track participation balance, topic drift, conversation quality metrics
- **Export/Import System**:
  - Export conversations in multiple formats (JSON, Markdown, PDF)
  - Export/import conversation configurations
  - Save and restore conversation state
  - Backup and recovery functionality

### Message Threading & Branching
- Support branching conversations where different AIs explore different aspects
- Thread management for complex multi-topic discussions
- Visual representation of conversation flow and branches

## Non-Functional Requirements

### Technology Stack
- Docker-based deployment
- Web UI for real-time interaction
- Real-time updates and live conversation flow

### Safety & Moderation
- Rely on built-in content moderation of AI models
- Prevent spam through conversation flow control mechanisms
- No additional external content moderation layer

### Performance & Reliability
- Handle multiple concurrent AI responses
- Maintain conversation state persistence
- Support for high-frequency message exchanges

## Technical Architecture

### System Components

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   Web Frontend      │    │   Python Backend     │    │  AI Providers   │
│   (Next.js + AI SDK)│◄──►│   (FastAPI)          │◄──►│  OpenAI/Claude  │
│                     │    │                      │    │  Gemini/Local   │
│   • AI SDK Streaming│    │ • LangGraph Native   │    │                 │
│   • LlamaIndex UI   │    │ • LlamaIndex Native  │    │                 │
│   • SSE Events      │    │ • SSE Streaming      │    │                 │
└─────────────────────┘    └──────────────────────┘    └─────────────────┘
         │                           │
         │                  ┌──────────────────┐
         │                  │   Redis Cache    │
         │                  │   • Multi-user   │
         │                  │   • Conversation │
         │                  │   • Queue State  │
         │                  └──────────────────┘
         │                           │
         │                  ┌──────────────────┐
         └──────────────────►│   PostgreSQL     │
                            │   • Conversations│
                            │   • Participants │
                            │   • Messages     │
                            └──────────────────┘
```

### Architecture Benefits

#### **Python + AI SDK Approach**
- **Native AI Integration**: Direct LangGraph and LlamaIndex usage without HTTP overhead
- **Custom Streaming Protocol**: LangGraph → AI SDK adapter to be developed for real-time events
- **Simplified Deployment**: Single backend service with custom streaming protocol
- **Developer Efficiency**: Leverages existing Python AI/ML expertise

### Core Services

#### 1. Multi-Participant Conversation Manager (Python + LangGraph)
- **Responsibilities**: Orchestrate multi-AI conversation flow using LangGraph
- **Key Features**:
  - Native LangGraph multi-agent orchestration
  - Weighted round-robin scheduling within conversation graph
  - SSE streaming with LangGraph → AI SDK event adapter
  - Redis-based multi-user session management

```python
from langgraph.graph import StateGraph
from typing import TypedDict, Annotated
import asyncio

class ConversationState(TypedDict):
    messages: list
    participants: dict
    current_speaker: str
    weights: dict
    conversation_id: str

class MultiParticipantConversation:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.participant_queues = {}
        self.conversation_graph = self.build_conversation_graph()

    def build_conversation_graph(self):
        graph = StateGraph(ConversationState)

        # Core conversation nodes
        graph.add_node("scheduler", self.weighted_round_robin)
        graph.add_node("ai_participant", self.process_ai_response)
        graph.add_node("broadcaster", self.broadcast_to_participants)

        # Conversation flow
        graph.add_edge("scheduler", "ai_participant")
        graph.add_edge("ai_participant", "broadcaster")
        graph.add_conditional_edges("broadcaster", self.should_continue)

        return graph.compile()

    async def weighted_round_robin(self, state: ConversationState):
        """Determine next AI participant based on weights and history"""
        participants = state["participants"]
        weights = state["weights"]

        # Calculate participation balance from Redis
        participation_data = await self.redis.hgetall(
            f"participation:{state['conversation_id']}"
        )

        # Select next participant based on weighted algorithm
        next_speaker = self.calculate_next_speaker(participants, weights, participation_data)

        return {"current_speaker": next_speaker}
```

#### 2. SSE Streaming Engine with AI SDK Integration
- **Responsibilities**: Stream LangGraph events to frontend via SSE
- **Key Features**:
  - Custom LangGraph → AI SDK protocol adapter (to be developed)
  - Multi-participant SSE connection management
  - Real-time event broadcasting to conversation participants
  - Connection recovery and state synchronization

```python
from fastapi import FastAPI
from sse_starlette.sse import EventSourceResponse
import json

class ConversationSSEManager:
    def __init__(self):
        self.active_connections = {}
        self.ai_sdk_adapter = LangGraphToAISDKAdapter()  # Custom adapter to build

    async def stream_conversation(self, conversation_id: str, participant_id: str):
        """Stream conversation events to specific participant"""
        queue = asyncio.Queue()
        connection_key = f"{conversation_id}:{participant_id}"
        self.active_connections[connection_key] = queue

        async def event_generator():
            try:
                while True:
                    # Wait for events from LangGraph conversation
                    langgraph_event = await queue.get()

                    # Custom adapter: LangGraph → AI SDK protocol (to be developed)
                    ai_sdk_event = self.ai_sdk_adapter.convert_event(langgraph_event)

                    yield {
                        "event": ai_sdk_event["type"],
                        "data": json.dumps(ai_sdk_event["data"])
                    }
            finally:
                # Cleanup connection
                del self.active_connections[connection_key]

        return EventSourceResponse(event_generator())

    async def broadcast_to_conversation(self, conversation_id: str, event):
        """Broadcast event to all participants in conversation"""
        for connection_key, queue in self.active_connections.items():
            if connection_key.startswith(f"{conversation_id}:"):
                await queue.put(event)

class LangGraphToAISDKAdapter:
    """Custom adapter to convert LangGraph events to AI SDK stream protocol"""

    def convert_event(self, langgraph_event):
        """Convert LangGraph event to AI SDK compatible format

        AI SDK Stream Protocol: https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol
        """
        event_type = langgraph_event.get("event", "unknown")

        if event_type == "on_chat_model_stream":
            # Convert streaming text chunks
            return {
                "type": "text-delta",
                "data": {
                    "textDelta": langgraph_event["data"]["chunk"]["content"]
                }
            }
        elif event_type == "on_chat_model_start":
            # Start of AI response
            return {
                "type": "text-start",
                "data": {}
            }
        elif event_type == "on_chat_model_end":
            # End of AI response
            return {
                "type": "text-done",
                "data": {}
            }
        elif event_type == "on_tool_start":
            # Tool execution start
            return {
                "type": "tool-call",
                "data": {
                    "toolCallId": langgraph_event["data"]["input"]["tool_call_id"],
                    "toolName": langgraph_event["name"],
                    "args": langgraph_event["data"]["input"]
                }
            }
        elif event_type == "on_tool_end":
            # Tool execution result
            return {
                "type": "tool-result",
                "data": {
                    "toolCallId": langgraph_event["data"]["input"]["tool_call_id"],
                    "result": langgraph_event["data"]["output"]
                }
            }
        else:
            # Custom conversation events
            return {
                "type": "conversation-event",
                "data": {
                    "eventType": event_type,
                    "participant": langgraph_event.get("participant"),
                    "data": langgraph_event.get("data", {})
                }
            }
```

#### 3. LangGraph AI Provider Integration
- **Responsibilities**: Native AI provider management within LangGraph nodes
- **Key Features**:
  - Direct OpenAI, Anthropic, Gemini integration in LangGraph nodes
  - Provider-specific streaming and event handling
  - Model parameter management per participant
  - Error handling and fallback providers

```python
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI

class AIProviderNode:
    def __init__(self):
        self.providers = {
            "openai": ChatOpenAI,
            "anthropic": ChatAnthropic,
            "gemini": ChatGoogleGenerativeAI,
            "local": self.setup_local_provider
        }

    async def process_ai_response(self, state: ConversationState):
        """Process AI response within LangGraph node"""
        current_speaker = state["current_speaker"]
        participant_config = state["participants"][current_speaker]

        # Get configured AI provider for this participant
        provider = self.providers[participant_config["provider"]]
        llm = provider(
            model=participant_config["model"],
            temperature=participant_config.get("temperature", 0.7),
            # ... other config
        )

        # Stream response and emit events for SSE
        async for chunk in llm.astream(state["messages"]):
            # Emit streaming events that get converted to AI SDK format
            yield {
                "type": "text_chunk",
                "participant": current_speaker,
                "content": chunk.content,
                "metadata": {"model": participant_config["model"]}
            }
```

#### 4. LlamaIndex File Processing Service
- **Responsibilities**: Handle file uploads and document analysis
- **Key Features**:
  - Native LlamaIndex document processing
  - File embedding and retrieval for AI participants
  - Multi-participant file sharing
  - Integration with conversation context

```python
from llama_index.core import VectorStoreIndex, Document
from llama_index.core.chat_engine import ContextChatEngine

class FileProcessingService:
    def __init__(self):
        self.document_stores = {}  # Per conversation document storage

    async def process_uploaded_file(self, conversation_id: str, file_content: bytes, filename: str):
        """Process uploaded file with LlamaIndex"""
        # Create document from file
        document = Document(
            text=file_content.decode('utf-8'),
            metadata={"filename": filename, "conversation_id": conversation_id}
        )

        # Create or update vector index for this conversation
        if conversation_id not in self.document_stores:
            self.document_stores[conversation_id] = VectorStoreIndex([])

        self.document_stores[conversation_id].insert(document)

        # Return file analysis summary for conversation
        return {
            "filename": filename,
            "summary": await self.generate_file_summary(document),
            "indexed": True
        }

    def get_context_chat_engine(self, conversation_id: str):
        """Get chat engine with file context for AI participants"""
        if conversation_id in self.document_stores:
            return ContextChatEngine.from_defaults(
                retriever=self.document_stores[conversation_id].as_retriever()
            )
        return None
```

#### 5. Redis-Based State Management
- **Responsibilities**: Multi-user conversation state and participant queues
- **Key Features**:
  - Conversation state persistence across requests
  - Participant weight and turn tracking
  - SSE connection management
  - Real-time analytics data

```python
import redis.asyncio as redis
import json

class ConversationStateManager:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url)

    async def save_conversation_state(self, conversation_id: str, state: ConversationState):
        """Save conversation state to Redis"""
        await self.redis.hset(
            f"conversation:{conversation_id}",
            mapping={
                "state": json.dumps(state),
                "updated_at": datetime.utcnow().isoformat()
            }
        )

    async def track_participation(self, conversation_id: str, participant_id: str, message_length: int):
        """Track participant activity for weighted scheduling"""
        key = f"participation:{conversation_id}"
        await self.redis.hincrby(key, f"{participant_id}:message_count", 1)
        await self.redis.hincrby(key, f"{participant_id}:total_length", message_length)
        await self.redis.hset(key, f"{participant_id}:last_active", datetime.utcnow().isoformat())
```

### Data Models

#### Conversation
```json
{
  "id": "uuid",
  "title": "string",
  "template": "string",
  "participants": ["participant_id"],
  "messages": ["message_id"],
  "branches": ["branch_id"],
  "state": "active|paused|archived",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "config": {
    "weighted_robin": true,
    "allow_branching": true,
    "max_participants": 10
  }
}
```

#### Participant
```json
{
  "id": "uuid",
  "name": "string",
  "type": "ai|human",
  "provider": "openai|anthropic|gemini|local",
  "model": "string",
  "config": {
    "system_prompt": "string (includes personality and role definition)",
    "temperature": 0.7,
    "max_tokens": 2048,
    "expertise": ["string"],
    "weight": 1.0
  }
}
```

#### Message
```json
{
  "id": "uuid",
  "conversation_id": "uuid",
  "participant_id": "uuid",
  "content": "string",
  "timestamp": "timestamp",
  "branch_id": "uuid",
  "parent_message_id": "uuid",
  "attachments": ["file_id"],
  "tool_results": ["tool_result_id"]
}
```

### Technology Stack

#### Frontend
- **Framework**: Next.js (React-based) with App Router
- **AI Streaming**: Vercel AI SDK (@ai-sdk/react, @ai-sdk/ui)
- **UI Components**:
  - LlamaIndex Chat UI components
  - Tailwind CSS or shadcn/ui
  - Custom multi-participant conversation components
- **Real-time**: Server-Sent Events (SSE) via AI SDK
- **State Management**: Zustand or React Context + AI SDK hooks
- **Visualization**: D3.js for conversation flow and branching diagrams

#### Backend (Python)
- **Framework**: FastAPI with async support
- **AI Orchestration**: LangGraph for multi-agent conversation management
- **File Processing**: LlamaIndex for document processing and RAG
- **Streaming**: SSE with sse-starlette
- **AI Providers**:
  - `langchain-openai` for OpenAI
  - `langchain-anthropic` for Claude
  - `langchain-google-genai` for Gemini
  - Custom adapters for local models
- **API Protocol**: RESTful API + SSE streaming endpoints

#### Database & Caching
- **Primary Database**: PostgreSQL with async support (asyncpg)
- **Cache & State**: Redis for:
  - Multi-user session management
  - Conversation state persistence
  - Participant turn tracking
  - SSE connection management
- **Vector Store**: Chroma or Pinecone for LlamaIndex document embeddings
- **File Storage**: S3-compatible storage for file uploads

#### Key Libraries & Dependencies
```python
# Backend (Python)
fastapi==0.104.1
langchain==0.1.0
langgraph==0.0.40
llama-index==0.9.0
sse-starlette==1.6.5
redis==5.0.1
asyncpg==0.29.0
uvicorn[standard]==0.24.0
```

```typescript
// Frontend (Node.js)
"@ai-sdk/react": "^0.0.9"
"@ai-sdk/ui": "^0.0.13"
"llamaindex": "^0.1.12"
"next": "14.0.4"
"react": "^18.2.0"
"zustand": "^4.4.7"
"tailwindcss": "^3.3.6"
"d3": "^7.8.5"
```

#### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Python ASGI Server**: Uvicorn with Gunicorn for production
- **Frontend Deployment**: Vercel or Next.js standalone
- **Load Balancer**: Nginx for SSE connection management
- **Monitoring**:
  - FastAPI built-in metrics
  - Prometheus + Grafana
  - LangSmith for LangGraph tracing
- **Logging**: Python logging + Sentry for error tracking

### Security Considerations

#### Authentication & Authorization
- JWT-based authentication
- Role-based access control (admin, user, guest)
- API key management for AI providers

#### Data Protection
- Encrypt sensitive configuration data
- Secure storage of API keys
- HTTPS/WSS for all communications
- Input sanitization and validation

#### Rate Limiting
- Per-user conversation limits
- AI provider API rate limiting
- DoS protection mechanisms

## Implementation Roadmap

### Phase 1: Core Python Foundation (Months 1-2)
**Goal**: Basic multi-AI conversation system with LangGraph

#### Sprint 1.1: Project Setup & Python Backend
- [ ] Initialize Python project structure with Docker setup
- [ ] Set up FastAPI backend with async support
- [ ] Implement database schema (PostgreSQL + asyncpg)
- [ ] Redis setup for state management and caching
- [ ] Basic authentication system with JWT

#### Sprint 1.2: LangGraph Multi-Agent Foundation
- [ ] LangGraph conversation graph setup
- [ ] Basic ConversationState management
- [ ] AI Provider integration within LangGraph nodes:
  - [ ] OpenAI (langchain-openai)
  - [ ] Anthropic Claude (langchain-anthropic)
  - [ ] Google Gemini (langchain-google-genai)
  - [ ] Local model support (custom adapters)
- [ ] Simple participant management in graph state

#### Sprint 1.3: SSE Streaming with AI SDK Integration
- [ ] Research AI SDK stream protocol specification
- [ ] Design LangGraph → AI SDK event mapping
- [ ] Implement custom LangGraphToAISDKAdapter class
- [ ] SSE streaming setup with sse-starlette
- [ ] Test adapter with basic LangGraph events
- [ ] REST API endpoints for conversation operations
- [ ] Multi-participant SSE connection management

### Phase 2: Frontend & Real-time Experience (Month 3)
**Goal**: Live conversation experience with AI SDK

#### Sprint 2.1: Next.js Frontend with AI SDK
- [ ] Next.js frontend setup with App Router
- [ ] AI SDK integration (@ai-sdk/react, @ai-sdk/ui)
- [ ] Custom SSE connection handling for multi-participant conversations
- [ ] Test frontend with LangGraph → AI SDK adapter
- [ ] Basic conversation UI components
- [ ] LlamaIndex Chat UI integration

#### Sprint 2.2: Multi-Participant UI
- [ ] Multi-participant conversation interface
- [ ] Real-time participant status display
- [ ] Message attribution and participant identification
- [ ] Basic conversation controls (pause/resume)
- [ ] Connection recovery and state synchronization

#### Sprint 2.3: Weighted Round-Robin in LangGraph
- [ ] Advanced scheduling algorithm in conversation graph
- [ ] Participant weight configuration and Redis tracking
- [ ] Turn management within LangGraph flow
- [ ] Anti-spam conversation flow controls
- [ ] Participation balance analytics

### Phase 3: Advanced Features (Months 4-5)
**Goal**: Rich conversation capabilities with LlamaIndex integration

#### Sprint 3.1: Conversation Branching in LangGraph
- [ ] Branch data model in ConversationState
- [ ] LangGraph conditional edges for branching
- [ ] Branch creation and management endpoints
- [ ] Frontend UI for branching visualization (D3.js)
- [ ] Branch navigation and SSE event handling

#### Sprint 3.2: LlamaIndex File & Tool Integration
- [ ] LlamaIndex file processing service
- [ ] File upload with document embedding
- [ ] Code execution sandbox integration
- [ ] Web search tool integration with LangGraph
- [ ] Tool result sharing in conversation streams
- [ ] File analysis by AI participants with context retrieval

#### Sprint 3.3: Participant Pool & Templates
- [ ] Participant pool management with Redis storage
- [ ] Conversation templates with LangGraph configurations
- [ ] Enhanced AI participant system prompts with expertise roles
- [ ] Template-based conversation creation
- [ ] Import/export participant configurations (JSON)

### Phase 4: Analytics & Export (Month 6)
**Goal**: Conversation insights and data management

#### Sprint 4.1: Analytics Engine
- [ ] Participation balance tracking
- [ ] Message frequency and length analysis
- [ ] Topic drift detection algorithms
- [ ] Conversation quality scoring
- [ ] Analytics dashboard

#### Sprint 4.2: Export/Import System
- [ ] Export conversations (JSON, Markdown, PDF)
- [ ] Import conversation history
- [ ] Configuration export/import
- [ ] Backup and recovery system
- [ ] Data migration tools

#### Sprint 4.3: Advanced UI Features
- [ ] Conversation flow visualization (D3.js)
- [ ] Advanced message editing capabilities
- [ ] Drag-and-drop participant management
- [ ] Real-time analytics display

### Phase 5: Production Ready (Months 7-8)
**Goal**: Scalable, secure, and maintainable system

#### Sprint 5.1: Performance & Scalability
- [ ] Database optimization and indexing
- [ ] Caching layer implementation (Redis)
- [ ] Load balancing setup
- [ ] Message queue system (Redis/RabbitMQ)
- [ ] Performance monitoring

#### Sprint 5.2: Security & Compliance
- [ ] Comprehensive input validation
- [ ] API key encryption and management
- [ ] Rate limiting implementation
- [ ] Security audit and penetration testing
- [ ] GDPR compliance features

#### Sprint 5.3: Production Deployment
- [ ] Kubernetes deployment manifests
- [ ] CI/CD pipeline setup
- [ ] Monitoring and logging (Prometheus/Grafana)
- [ ] Error tracking and alerting
- [ ] Documentation and user guides

### Phase 6: Enhancement & Optimization (Ongoing)
**Goal**: Continuous improvement and feature expansion

#### Future Features to Consider:
- [ ] Voice/audio message support
- [ ] Multi-language conversation support
- [ ] AI model fine-tuning based on conversation patterns
- [ ] Conversation replay and simulation
- [ ] Integration with external tools (GitHub, Slack, etc.)
- [ ] Mobile app development
- [ ] API marketplace for custom AI providers
- [ ] Advanced conversation moderation tools

### Development Estimates (Python + AI SDK Stack)

| Phase | Duration | Effort (Person-Days) | Priority | Key Technologies |
|-------|----------|---------------------|----------|------------------|
| Phase 1 | 2 months | 35-45 days | High | FastAPI, LangGraph, PostgreSQL, Redis |
| Phase 2 | 1 month | 20-25 days | High | Next.js, AI SDK, SSE, LlamaIndex UI |
| Phase 3 | 2 months | 30-40 days | Medium | LlamaIndex, D3.js, File Processing |
| Phase 4 | 1 month | 15-20 days | Medium | Analytics, Export, PDF Generation |
| Phase 5 | 2 months | 25-35 days | High | Production, Docker, Monitoring |
| Phase 6 | Ongoing | N/A | Low | Future Enhancements |

**Total Estimated Effort**: 135-175 person-days
**Additional Effort**: +10 days for custom LangGraph → AI SDK adapter development
**Benefits**: Single cohesive codebase, full control over streaming protocol, tailored for multi-participant conversations

### Success Metrics

#### Technical Metrics
- System can handle 100+ concurrent conversations
- Response latency < 200ms for message routing
- 99.9% uptime for core services
- Support for 10+ AI participants per conversation

#### User Experience Metrics
- Average conversation session > 15 minutes
- User retention rate > 70% after first week
- Conversation completion rate > 80%
- Export feature usage > 30% of active users

### Risk Assessment

#### High Risk
- **SSE Connection Management**: Multi-participant SSE requires careful queue management
- **LangGraph Complexity**: Complex conversation graphs may impact performance
- **AI Provider Rate Limits**: Implement robust queuing and fallback mechanisms

#### Medium Risk
- **Real-time Multi-User**: SSE vs WebSocket tradeoffs for multi-participant features
- **Complex UI for Branching**: D3.js visualization and LangGraph integration
- **Python GIL Limitations**: May need multiple workers for high concurrency

#### Low Risk
- **Technology Maturity**: FastAPI, LangGraph, AI SDK are proven technologies
- **Well-defined Protocol**: AI SDK stream protocol is documented and stable
- **Feature Creep**: Well-defined MVP with clear technology choices

### Migration Path from Current Architecture

If starting with proven technologies:

#### **Phase 0: Proof of Concept (3-4 weeks)**
- [ ] Simple FastAPI + LangGraph setup
- [ ] Research and prototype LangGraph → AI SDK adapter
- [ ] Basic Next.js frontend with AI SDK
- [ ] Test custom adapter with 2-3 AI participants
- [ ] Validate SSE performance with multiple connections
- [ ] Confirm multi-participant conversation flow
- [ ] Document adapter design and event mapping

This approach reduces risk by validating the core architecture and custom adapter before full development.

### LangGraph → AI SDK Adapter Development Guide

#### **Understanding the AI SDK Stream Protocol**

The AI SDK expects specific event types for optimal frontend integration:

```typescript
// AI SDK Stream Protocol Events
type StreamEvent =
  | { type: 'text-start' }
  | { type: 'text-delta', data: { textDelta: string } }
  | { type: 'text-done' }
  | { type: 'tool-call', data: { toolCallId: string, toolName: string, args: any } }
  | { type: 'tool-result', data: { toolCallId: string, result: any } }
  | { type: 'error', data: { error: string } }
```

#### **LangGraph Event Types to Map**

Key LangGraph events that need conversion:
- `on_chat_model_start` → `text-start`
- `on_chat_model_stream` → `text-delta`
- `on_chat_model_end` → `text-done`
- `on_tool_start` → `tool-call`
- `on_tool_end` → `tool-result`
- Custom conversation events → `conversation-event`

#### **Development Phases for Adapter**

1. **Basic Text Streaming** (Week 1)
   - Map basic chat model events
   - Test with single AI participant

2. **Tool Integration** (Week 2)
   - Add tool call event mapping
   - Test with LangGraph tools

3. **Multi-Participant Events** (Week 3)
   - Add custom conversation events
   - Test with multiple AI participants

4. **Error Handling & Edge Cases** (Week 4)
   - Handle connection drops
   - Error event mapping
   - Performance optimization
