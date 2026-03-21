# Quantixone Workflow Builder

A full-stack workflow automation platform that lets users upload JSON workflow definitions, visualize them as interactive flowcharts, and execute actions via a **drag-to-action** system. Built with **FastAPI + MongoDB** on the backend and **React + ReactFlow** on the frontend.

---

## 🌐 Live Deployment

| Layer    | Platform | URL |
|----------|----------|-----|
| Backend  | [Render](https://render.com) | Set via `render.yaml` |
| Frontend | [Vercel](https://vercel.com) | Set via `frontend/vercel.json` |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (React)                  │
│                                                     │
│  Upload Page ─────► Builder Page                    │
│  (/ route)          (/builder route)                │
│                     ┌──────────┬───────────┐        │
│                     │ ReactFlow│ Sidebar   │        │
│                     │ Canvas   │ ┌────────┐│        │
│                     │          │ │Contacts ││        │
│                     │  Drag ──►│ │Panel   ││        │
│                     │  Nodes   │ ├────────┤│        │
│                     │          │ │Opps    ││        │
│                     │          │ │Panel   ││        │
│                     │          │ ├────────┤│        │
│                     │          │ │Execute ││        │
│                     │          │ │Panel   ││        │
│                     │          │ ├────────┤│        │
│                     │          │ │Exec    ││        │
│                     │          │ │Logs    ││        │
│                     └──────────┴─┴────────┘│        │
└───────────────────────────┬─────────────────────────┘
                            │ Axios API calls
┌───────────────────────────▼─────────────────────────┐
│                   BACKEND (FastAPI)                  │
│                                                     │
│  Routes ──► Services ──► Repositories ──► MongoDB   │
│                                                     │
│  /workflows   /contacts   /opportunities            │
│  /messages    /registries                            │
└─────────────────────────────────────────────────────┘
```

### Three-Layer System

1. **JSON → Flowchart**: Upload a workflow JSON file → validates DAG (5 rules) → renders as ReactFlow flowchart
2. **Flowchart → Saved Workflow**: Save the flowchart → stored in MongoDB → can be listed, updated, deleted
3. **Drag-to-Action**: Drag nodes from the canvas onto sidebar panels → triggers real backend API calls

---

## 🛠️ Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | FastAPI |
| Database | MongoDB Atlas (via Motor async driver) |
| Validation | Pydantic v2 |
| Config | pydantic-settings + python-dotenv |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | React 18 (Vite) |
| Flowchart | ReactFlow 11 |
| Routing | React Router v6 |
| HTTP | Axios |
| Icons | Lucide React |
| Styling | Vanilla CSS (no Tailwind) |

---

## 📦 Project Structure

```
workflow/
├── app/
│   ├── main.py                          # FastAPI app, CORS, router registration
│   ├── core/
│   │   └── database.py                  # MongoDB connection via Motor
│   ├── models/
│   │   ├── workflow.py                  # Pydantic models: WorkflowCreate, Step, Trigger
│   │   ├── contact.py                   # ContactCreate, ContactUpdate, TagsAdd
│   │   └── opportunity.py               # OpportunityCreate, MoveStage
│   ├── repositories/
│   │   ├── workflow_repo.py             # Workflow CRUD operations
│   │   ├── execution_repo.py            # Execution log persistence
│   │   ├── contact_repo.py             # Contact CRUD
│   │   └── opportunity_repo.py          # Opportunity CRUD + update()
│   ├── services/
│   │   ├── workflow_service.py          # DAG validation, format conversion
│   │   ├── execution_service.py         # DAG walker / step executor
│   │   ├── contact_service.py           # Contact business logic
│   │   └── opportunity_service.py       # Opportunity business logic
│   └── routes/
│       ├── workflow_routes.py           # /workflows (+/import, /activate, /deactivate)
│       ├── execution_routes.py          # /workflows/{id}/execute, /executions
│       ├── contact_routes.py            # /contacts (+/bulk)
│       ├── opportunity_routes.py        # /opportunities (+/pipelines)
│       ├── message_routes.py            # /messages (sms, email, whatsapp)
│       └── registry_routes.py           # /registries (triggers, actions)
├── frontend/
│   ├── src/
│   │   ├── main.jsx                     # React entry point
│   │   ├── App.jsx                      # BrowserRouter with 2 routes
│   │   ├── index.css                    # Global styles + drop zone CSS
│   │   ├── pages/
│   │   │   ├── UploadPage.jsx           # File upload + validation + preview
│   │   │   └── BuilderPage.jsx          # Canvas + sidebar + topbar
│   │   ├── components/
│   │   │   ├── FlowCanvas.jsx           # ReactFlow wrapper
│   │   │   ├── CustomNodes.jsx          # 4 node types with drag support
│   │   │   ├── ContactsPanel.jsx        # CRM contacts + drop zone
│   │   │   ├── OpportunitiesPanel.jsx   # CRM deals + drop zone
│   │   │   ├── ExecutePanel.jsx         # Full workflow execution drop zone
│   │   │   ├── ExecutionLogs.jsx        # Step log timeline viewer
│   │   │   ├── CollapsiblePanel.jsx     # Reusable sidebar panel
│   │   │   └── Toast.jsx               # Notification toasts
│   │   ├── services/
│   │   │   └── api.js                   # Axios API client (all endpoints)
│   │   └── utils/
│   │       ├── parser.js                # extractWorkflow, validateWorkflow, etc.
│   │       └── dragHelpers.js           # parseDropData utility
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json                      # Vercel SPA deployment config
├── render.yaml                          # Render backend deployment config
├── requirements.txt
├── workflow_export_import.json          # Sample workflow JSON
├── bodys.json                           # Sample API request bodies
├── DRAG_TO_ACTION.md                    # Drag-to-action system documentation
├── API_REFERENCE.md                     # Complete API reference with cURL examples
└── .env                                 # MongoDB connection string (not committed)
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Backend Setup

```bash
# 1. Create and activate virtual environment
python -m venv venv
venv\Scripts\activate         # Windows
source venv/bin/activate      # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
# Create .env file with your MongoDB connection string:
echo MONGODB_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/workflow_automation > .env

# 4. Start backend
uvicorn app.main:app --reload
# Backend runs on http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

### Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. (Optional) Set backend URL if not localhost
# Create .env file:
echo VITE_API_BASE_URL=http://localhost:8000 > .env

# 4. Start dev server
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🖥️ Pages & User Flow

### 1. Upload Page (`/`)

- **Drag-and-drop** a `.json` workflow file or click to browse
- Automatically validates the DAG against 5 rules:
  1. Trigger must exist with a `type`
  2. Steps array must not be empty
  3. All step IDs must be unique
  4. All `on_success`, `on_failure`, `branches` references must point to valid step IDs
  5. No cycles allowed (DFS-based cycle detection)
- Shows a **preview card** with workflow name, tags, step breakdown
- **"Load from Database"** button opens a modal listing saved workflows
- Click **"Open in Builder →"** to navigate to the builder

### 2. Builder Page (`/builder`)

- **Topbar**: Inline-editable workflow name, active/inactive toggle, Save/Execute/Delete buttons
- **Canvas (65%)**: ReactFlow flowchart with 4 node types:
  - ⚡ Trigger Node (amber border)
  - ⚙ Action Node (blue border) — with human-readable config summaries
  - ⑂ Condition Node (purple border) — shows rule preview
  - ⏱ Delay Node (teal border) — shows duration
- **Sidebar (35%)**: Four collapsible panels:
  - 📋 Execution Logs — step-by-step timeline with status dots
  - 👤 Contacts CRM — CRUD + drag-and-drop target
  - 💼 Opportunities — CRUD + drag-and-drop target
  - ⚡ Execute Workflow — drop any node to trigger full execution

---

## 🎯 Drag-to-Action System

The core UX innovation. Every node on the canvas is HTML5-draggable. When dropped on a sidebar panel, it triggers a specific backend API call.

See [DRAG_TO_ACTION.md](DRAG_TO_ACTION.md) for the full action matrix and technical details.

| Drop Target → | Contacts Panel | Opportunities Panel | Execute Panel |
|----------------|---------------|-------------------|---------------|
| **send_email** | Send email to contact | Send email to linked contact | Execute full workflow |
| **send_sms** | Send SMS to contact | Send SMS to linked contact | Execute full workflow |
| **send_whatsapp** | Send WhatsApp to contact | Send WhatsApp to linked contact | Execute full workflow |
| **add_tag** | Add tags to contact | Add tags to linked contact | Execute full workflow |
| **update_contact** | Update contact fields | Update linked contact fields | Execute full workflow |
| **move_pipeline** | ⚠ "Applies to opps" | Move opp to target stage | Execute full workflow |
| **create_opportunity** | Create opp for contact | ⚠ "Already an opp" | Execute full workflow |

---

## 📡 API Endpoints

See [API_REFERENCE.md](API_REFERENCE.md) for the complete reference with cURL examples.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/workflows` | Create workflow (with DAG validation) |
| `POST` | `/workflows/import` | Import Quantixone JSON format |
| `GET` | `/workflows` | List all workflows |
| `GET` | `/workflows/{id}` | Get workflow by ID |
| `PUT` | `/workflows/{id}` | Update workflow |
| `DELETE` | `/workflows/{id}` | Delete workflow |
| `POST` | `/workflows/{id}/activate` | Set status to active |
| `POST` | `/workflows/{id}/deactivate` | Set status to inactive |
| `POST` | `/workflows/{id}/execute` | Execute workflow (DAG walker) |
| `GET` | `/workflows/{id}/executions` | List execution history |
| `GET` | `/workflows/{id}/executions/{eid}` | Get execution details |
| `POST` | `/contacts` | Create contact |
| `POST` | `/contacts/bulk` | Bulk create contacts |
| `GET` | `/contacts` | List contacts |
| `GET` | `/contacts/{id}` | Get contact |
| `PUT` | `/contacts/{id}` | Update contact |
| `DELETE` | `/contacts/{id}` | Delete contact |
| `POST` | `/contacts/{id}/tags` | Add tags (deduplicates) |
| `POST` | `/opportunities` | Create opportunity |
| `GET` | `/opportunities` | List opportunities |
| `GET` | `/opportunities/pipelines` | Get pipeline stage definitions |
| `GET` | `/opportunities/{id}` | Get opportunity |
| `PUT` | `/opportunities/{id}` | Update opportunity fields |
| `PUT` | `/opportunities/{id}/move` | Move to pipeline stage |
| `DELETE` | `/opportunities/{id}` | Delete opportunity |
| `POST` | `/messages/sms` | Send SMS (simulated) |
| `POST` | `/messages/email` | Send email (simulated) |
| `POST` | `/messages/whatsapp` | Send WhatsApp (simulated) |
| `GET` | `/messages/{id}` | Get message by ID |
| `GET` | `/registries/triggers` | List available trigger types |
| `GET` | `/registries/actions` | List available action types |

---

## 🔧 DAG Validation Rules

The backend enforces 5 structural rules on every workflow:

1. **Trigger Required** — Must have a `trigger` object with a `type` field
2. **Non-Empty Steps** — `steps` array must contain at least one step
3. **Unique IDs** — Every step must have a unique `id`
4. **Reference Integrity** — All `on_success`, `on_failure`, `on_complete`, `branches.true`, `branches.false` must point to existing step IDs
5. **No Cycles** — DFS-based cycle detection ensures the graph is a valid DAG

The frontend mirrors these rules in `parser.js → validateWorkflow()` for instant client-side feedback before any API call.

---

## 🌍 Deployment

### Backend → Render

The `render.yaml` at the project root configures:
- Python runtime
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment variable: `MONGODB_URL` (set in Render dashboard)

### Frontend → Vercel

The `frontend/vercel.json` configures:
- Build: `npm run build`
- Output: `dist/`
- SPA rewrite: all routes → `index.html` (for React Router)
- Environment variable: `VITE_API_BASE_URL` (set in Vercel dashboard)

---

## 🔮 Future Work / AI Features

> **Note:** The following features are documented as future enhancements and are **not implemented** in the current version.

- **AI Workflow Suggestions** — Suggest next steps based on the current DAG structure using ML
- **Natural Language to Workflow** — Convert plain English descriptions into workflow JSON
- **Smart Contact Segmentation** — AI-powered contact grouping based on behavior patterns
- **Predictive Pipeline Scoring** — Score opportunities based on historical conversion data
- **Anomaly Detection in Execution Logs** — Flag unusual step durations or failure patterns
- **Auto-Retry with Intelligent Backoff** — ML-based retry policies instead of fixed intervals

---

## ⚠️ Constraints & Design Decisions

- **No Authentication** — No login, API keys, or JWT. All endpoints are open.
- **No WebSockets** — All data is fetched via REST polling. No real-time push.
- **No Task Queues** — Execution is synchronous (no Celery, SQS, or Redis).
- **No Test Files** — Verification is done via manual browser testing and API calls.
- **Simulated Messages** — SMS/email/WhatsApp are simulated (persisted to DB, not actually sent).
- **Template Variables Skipped** — Values like `{{contact.email}}` in `update_contact` configs are filtered out during drag-to-action drops since they can't be resolved in the UI.

---

## 📝 License

This project is part of the Quantixone Backend Assignment.
