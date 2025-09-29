# Getting Started with Conversaition

This guide will help you set up and run Conversaition for the first time.

## Prerequisites

### Required Software
- **Python 3.13+** (Python 3.9+ may work but 3.13 is recommended)
- **Node.js 18+** and npm
- **Git** (for cloning the repository)

### Required API Keys
You'll need API keys from at least one of these providers:
- **OpenAI** - https://platform.openai.com/api-keys
- **Anthropic** - https://console.anthropic.com/settings/keys
- **Google AI** - https://makersuite.google.com/app/apikey

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/conversaition.git
cd conversaition
```

### 2. Backend Setup

```bash
cd backend

# Create Python virtual environment
python3.13 -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration

Create a `.env` file in the `backend/` directory:

```bash
# backend/.env
OPENAI_API_KEY=sk-...your-key-here...
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
GOOGLE_API_KEY=...your-key-here...

# Optional: Custom API base URL for frontend
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

**Note:** You need at least one API key. If you only have one provider, you can modify `backend/participants_config.json` to use only that provider's participants.

### 4. Frontend Setup

```bash
cd ../frontend  # From backend directory

# Install dependencies
npm install
```

## Running the Application

You'll need two terminal windows running simultaneously.

### Terminal 1: Start Backend

```bash
cd backend
.venv/bin/python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

The backend API is now available at **http://localhost:8000**

### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

You should see:
```
▲ Next.js 15.5.3
- Local:        http://localhost:3000
✓ Ready in 1808ms
```

The frontend is now available at **http://localhost:3000**

## First Conversation

1. **Open your browser** to http://localhost:3000
2. **Select participants** - By default, Alice, Bob, and Charlie are selected
3. **Enter a topic** - Try "Should AI have creative rights?" or any topic you're interested in
4. **Click "Start Conversation"** - Watch the AIs discuss in real-time!

### Understanding the Interface

- **Status Indicators**: Shows connection status and conversation state
- **Participant Selection**: Choose which AIs participate (at least one required)
- **Conversation Controls**:
  - **Pause** - Stop the conversation temporarily
  - **Resume** - Continue after pause
  - **Stop** - End and save the conversation
- **Human Injection**: While paused, you can inject your own messages
- **Manage Participants**: Create, edit, or delete AI participants

## Verifying Installation

### Check Backend Health

```bash
curl http://localhost:8000/health
```

Should return:
```json
{"status": "healthy", "message": "Backend is running"}
```

### Check Participants

```bash
curl http://localhost:8000/participants
```

Should list Alice, Bob, and Charlie with their configurations.

## Troubleshooting

### Backend won't start

**Problem:** `ModuleNotFoundError` or missing dependencies
**Solution:**
```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
```

**Problem:** API key errors
**Solution:** Check your `.env` file exists and has valid API keys

### Frontend won't start

**Problem:** `npm install` fails
**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Problem:** Port 3000 already in use
**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Or run on different port
PORT=3001 npm run dev
```

### No AI responses

**Problem:** Conversation starts but AIs don't respond
**Solution:**
- Check backend console for errors
- Verify API keys are valid and have quota
- Check participant configurations in `/participants` page

### Connection issues

**Problem:** "Disconnected" status in UI
**Solution:**
- Ensure backend is running on port 8000
- Check browser console for error messages
- Verify CORS settings if using custom domain

## Common Issues

### Python Version
If you don't have Python 3.13, you can try Python 3.9+ but may encounter minor issues:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Virtual Environment on Windows
Windows users should use:
```cmd
.venv\Scripts\activate
```

### Missing API Keys
If you only have OpenAI keys, edit `backend/participants_config.json` to remove Anthropic and Gemini participants.

## Next Steps

- **[Development Guide](DEVELOPMENT.md)** - Learn about testing, linting, and development workflow
- **[Architecture Overview](ARCHITECTURE.md)** - Understand how the system works
- **[Participants Management](docs/guides/managing-participants.md)** - Customize AI personalities
- **[API Reference](docs/api/README.md)** - Explore the REST API

## Getting Help

If you encounter issues:
1. Check the [Common Issues](#common-issues) section above
2. Review backend logs in Terminal 1
3. Check browser console in DevTools (F12)
4. Open an issue on GitHub with error details

---

**Ready to dive deeper?** Check out the [Development Guide](DEVELOPMENT.md) for testing, linting, and advanced features.