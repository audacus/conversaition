# Setup

## Prerequisites
- Python 3.13+, Node.js 18+
- API keys: OpenAI, Anthropic, and/or Google AI

## Install

```bash
# Backend
cd backend
python3.13 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt

# Create backend/.env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Frontend
cd ../frontend
npm install
```

## Run

**Terminal 1:** `cd backend && .venv/bin/python main.py`
**Terminal 2:** `cd frontend && npm run dev`

Visit **http://localhost:3000**

## Verify

```bash
# Health check
curl http://localhost:8000/health

# List participants
curl http://localhost:8000/participants
```

## Troubleshooting

**Backend won't start**
- Check .env file exists with valid API keys
- Reinstall: `.venv/bin/python -m pip install -r requirements.txt`

**Frontend won't start**
- `rm -rf node_modules package-lock.json && npm install`
- Port conflict: `lsof -ti:3000 | xargs kill -9`

**No AI responses**
- Check backend console for errors
- Verify API keys have quota
- Check participant configs at `/participants`

**Connection issues**
- Ensure backend running on :8000
- Check browser console for errors
- Verify CORS settings

## Single Provider Setup

Only have OpenAI? Edit `backend/participants_config.json` to remove Anthropic/Gemini participants.

## Python Version

Python 3.9+ may work but 3.13 recommended. Windows: use `.venv\Scripts\activate`
