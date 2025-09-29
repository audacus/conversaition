# Development Guide

## Running the Application

### Start Backend
```bash
cd backend
.venv/bin/python main.py  # http://localhost:8000
```

### Start Frontend
```bash
cd frontend
npm run dev  # http://localhost:3000
```

See [GETTING_STARTED.md](GETTING_STARTED.md) for detailed setup instructions.

## Development Workflow

### Backend Development

**Run tests:**
```bash
cd backend
python3 -m unittest backend.tests.test_conversation_graph
```

**Check Python syntax:**
```bash
python3 -m py_compile participants.py main.py
```

### Frontend Development

**Linting:**
```bash
cd frontend
npm run lint
```

**Type checking:**
```bash
npm run type-check
```

**Run Playwright tests:**
```bash
# Requires both servers running
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/participants-crud.spec.ts
```

## Code Style

### Python
- Follow PEP 8 style guide
- Use type hints where appropriate
- Async/await for I/O operations
- Docstrings for public functions

### TypeScript/React
- Use TypeScript strict mode
- Follow React hooks best practices
- Functional components only
- Props interfaces for all components

## Project Structure

```
backend/
├── main.py                 # FastAPI app
├── conversation_graph.py   # LangGraph orchestration
├── participants.py         # AI participant management
├── adapter.py             # SSE streaming
├── storage.py             # Transcript persistence
└── participants_config.json # AI configurations

frontend/
├── app/
│   ├── page.tsx           # Main conversation UI
│   ├── participants/      # Participants management
│   ├── hooks/             # React hooks
│   └── types/             # TypeScript types
└── tests/                 # Playwright E2E tests
```

## Testing

### Backend Tests
```bash
python3 -m unittest discover backend/tests
```

### Frontend E2E Tests
```bash
cd frontend
npm run test:e2e
```

### Manual Testing Checklist
- [ ] Start conversation with all 3 participants
- [ ] Pause and inject human message
- [ ] Resume conversation
- [ ] Stop and verify transcript saved
- [ ] Create new participant
- [ ] Edit existing participant
- [ ] Delete participant
- [ ] Verify participant list refreshes

## Common Tasks

### Adding a New AI Participant
1. Navigate to http://localhost:3000/participants
2. Click "Create Participant"
3. Fill in name, provider, model, system prompt
4. Save and test in a conversation

### Modifying System Prompts
Edit `backend/participants_config.json` directly or use the UI at `/participants`

### Viewing Transcripts
Saved to `backend/data/transcripts/` as JSON files

### Checking API Endpoints
Visit http://localhost:8000/docs for interactive API documentation

## Debugging

### Backend Debugging
- Check console output in Terminal 1
- Add print statements or use `logging.info()`
- Use Python debugger: `import pdb; pdb.set_trace()`

### Frontend Debugging
- Open browser DevTools (F12)
- Check Console tab for JavaScript errors
- Check Network tab for failed API calls
- Use React DevTools extension

### Common Issues
- **Port conflicts**: Kill process with `lsof -ti:8000 | xargs kill -9`
- **CORS errors**: Check backend CORS settings in `main.py`
- **API key errors**: Verify `.env` file configuration

## Contributing Guidelines

### Before Committing
1. Run linters: `npm run lint` (frontend)
2. Run tests: `npm run test:e2e` (frontend), `python3 -m unittest` (backend)
3. Check TypeScript: `npm run type-check`
4. Test manually with all 3 participants

### Commit Messages
Follow conventional commits:
- `feat: Add new feature`
- `fix: Bug fix`
- `docs: Documentation`
- `refactor: Code refactoring`
- `test: Tests`

### Pull Requests
- Keep PRs focused on single feature/fix
- Include tests for new features
- Update documentation as needed
- Test with all AI providers

## Performance Tips

- Use React DevTools Profiler to identify slow components
- Monitor backend logs for slow API calls
- Check SSE connection stability in Network tab
- Keep participant system prompts concise for faster responses

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [LangGraph Documentation](https://python.langchain.com/docs/langgraph)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Playwright Documentation](https://playwright.dev/)