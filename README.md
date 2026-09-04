# Medical Supply Coordination Platform

A hospital medicine stock-sharing platform with AI-powered recommendations.

---

## Services

| Service | Tech | Directory | Port |
|---------|------|-----------|------|
| **Backend API** | Node.js + Express + MongoDB | `Backend/` | 5000 |
| **Frontend** | React + Vite | `Frontend/` | 5173 |
| **AI Recommendation Service** | Python + FastAPI | `ai-service/` | 8000 |

---

## Running All Services

```bash
# Terminal 1 — Backend
cd Backend
npm install
node server.js

# Terminal 2 — Frontend
cd Frontend/vite-project
npm install
npm run dev

# Terminal 3 — AI Service
cd ai-service
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

---

## AI Service — Quick Reference

- **Swagger UI**: http://localhost:8000/docs
- **Health check**: http://localhost:8000/api/v1/health
- **Full API docs**: [`ai-service/README.md`](ai-service/README.md)

### Main Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Service liveness |
| `POST` | `/api/v1/recommend/suppliers` | Given a request → rank best suppliers |
| `POST` | `/api/v1/recommend/recipients` | Given stock → rank best recipients |

---

## Running AI Service Tests

```bash
cd ai-service
.venv\Scripts\activate
pytest tests/ -v
```
