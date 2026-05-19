# bookLeafDemo

Unified multi-agent AI publishing platform.

## End-to-End Flow
1. Create project
2. Upload manuscript (PDF/DOCX/TXT)
3. Parser extracts text, chapters, chunks
4. Run centralized publishing workflow
5. Generate assets (summary, metadata, social, translation, cover, audiobook, rag_prep)
6. Track workflow + agent statuses
7. Use RAG chat for manuscript Q&A

## Architecture
- Backend: FastAPI + SQLAlchemy (async) + LangGraph + PostgreSQL
- Frontend: React + Vite + Tailwind
- Workflow orchestration: simple central manager service

## Workflow Statuses
- `pending`
- `running`
- `completed`
- `failed`

## Backend Setup
```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Frontend Setup
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

## Docker Setup
```bash
copy backend\\.env.example backend\\.env
docker compose up --build
```

## Main APIs
### Workflow
- `POST /api/workflow/run/{project_id}`
- `GET /api/workflow/status/{project_id}`

### Dashboard
- `GET /api/dashboard/projects`
- `GET /api/dashboard/project/{project_id}`

### Assets
- `GET /api/assets/{project_id}`
- `GET /api/assets/{project_id}/{asset_type}`

### Core
- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/{id}`
- `POST /api/upload`
- `GET /api/manuscripts/{id}`
- `GET /api/chapters/{id}`
- `POST /api/rag/chat/{project_id}`

## Frontend Workspace
- Dashboard with project lifecycle + workflow progress
- Project workspace with:
  - manuscript overview
  - workflow visualization
  - summaries
  - metadata
  - social media outputs
  - translation outputs
  - cover studio
  - audiobook panel
  - RAG chat
