# Development

## Commands

**Backend:**
```bash
cd backend
.venv/bin/python main.py          # Run server (or: uvicorn backend.main:app --reload)
python3 -m unittest backend.tests.test_conversation_graph  # Tests
python3 -m py_compile *.py        # Syntax check
```

**Frontend:**
```bash
cd frontend
npm run dev                        # Dev server
npm run lint                       # Linting
npm run type-check                 # TypeScript
npm run test:e2e                   # Playwright (requires servers)
npm run test:e2e -- tests/file.spec.ts  # Specific test
```

## Structure

```
backend/
├── main.py                   # FastAPI + endpoints
├── conversation_graph.py     # LangGraph orchestration
├── participants.py           # CRUD + validation
├── adapter.py               # SSE streaming
├── storage.py               # Transcript persistence
└── participants_config.json # AI configs

frontend/
├── app/page.tsx             # Main UI
├── app/participants/        # Management UI
├── app/hooks/               # React hooks
└── tests/                   # Playwright E2E
```

## Code Style

**Python:** PEP 8, type hints, async/await, docstrings
**TypeScript:** Strict mode, hooks only, functional components, props interfaces

## Testing

**Manual checklist:**
- Start conversation with 3 participants
- Pause + inject human message
- Resume conversation
- Stop + verify transcript saved
- CRUD participant operations
- Verify list refresh

## Common Tasks

**Add participant:** Use UI at `/participants` or edit `participants_config.json`
**View transcripts:** `backend/data/transcripts/*.json`
**API docs:** http://localhost:8000/docs

## Debugging

**Backend:** Console output, `logging.info()`, `import pdb; pdb.set_trace()`
**Frontend:** DevTools F12, Console tab, Network tab, React DevTools

**Port conflicts:** `lsof -ti:8000 | xargs kill -9`
**CORS errors:** Check `main.py` CORS settings
**API key errors:** Verify `.env`

## Contributing

**Before commit:**
1. `npm run lint` + `npm run type-check` (frontend)
2. `npm run test:e2e` + `python3 -m unittest` (tests)
3. Manual test with 3 participants

**Commit format:**
- `feat: Add feature`
- `fix: Bug fix`
- `docs: Documentation`
- `refactor: Refactoring`
- `test: Tests`

Keep commits short, imperative (128 chars max). Never mention AI tools in commits.

**PR guidelines:**
- Single feature/fix per PR
- Include tests for new features
- Update docs as needed
- Test with all AI providers