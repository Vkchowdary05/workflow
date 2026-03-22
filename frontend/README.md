# Quantixone Workflow Builder — Frontend

Visual workflow automation platform built with **React 18**, **ReactFlow 11**, and **pure CSS**.

## Quick Start

```bash
cd frontend
npm run dev        # → http://localhost:5173
```

> Backend must be running on `http://localhost:8000` (FastAPI).

## Architecture

```
src/
├── App.jsx                 # Shell: NavStrip + routing
├── index.css               # Plivo light-theme design system
├── components/
│   ├── NavStrip.jsx        # Dark navy sidebar (56 px)
│   ├── LeftSidebar.jsx     # Component palette + CRM tabs
│   ├── FlowCanvas.jsx      # ReactFlow wrapper
│   ├── CustomNodes.jsx      # Trigger, Action, Condition, Delay cards
│   ├── RightConfigPanel.jsx # Slide-in config panel
│   ├── AddNodeModal.jsx     # Insert-between-nodes modal
│   ├── ContactsPanel.jsx    # CRM contacts with drag-drop
│   ├── OpportunitiesPanel.jsx # CRM deals
│   ├── ExecutionLogs.jsx    # Execution history
│   ├── CollapsiblePanel.jsx # Collapsible wrapper
│   └── Toast.jsx            # Notification toasts
├── pages/
│   ├── UploadPage.jsx       # Home — upload / DB / templates / new
│   ├── BuilderPage.jsx      # Main canvas + sidebar + config
│   ├── WorkflowsPage.jsx    # Table listing of workflows
│   └── AnalyticsPage.jsx    # Basic analytics view
├── services/
│   └── api.js               # Axios API client
└── utils/
    ├── parser.js            # JSON ↔ ReactFlow converter
    └── dragHelpers.js       # Drag-and-drop utilities
```

## Pages

| Route        | Page             | Description                                |
|------------- |------------------|--------------------------------------------|
| `/`          | UploadPage       | Upload JSON, load from DB, use template    |
| `/builder`   | BuilderPage      | Visual canvas with sidebar + config panel  |
| `/workflows` | WorkflowsPage    | Table view of all saved workflows          |

## Key Features

- **Drag-and-drop** components from sidebar onto canvas
- **Node configuration** via slide-in right panel
- **Insert-between** nodes with the "+" button
- **Execute** workflows with real-time log display
- **Activate/deactivate** workflows
- **Import/export** JSON workflow definitions
- **Template system** for quick-start workflows
- **CRM integration** — contacts, deals, pipeline stages

## API Reference

All API calls go through `src/services/api.js`:

- `workflowAPI` — CRUD, activate, execute, import, duplicate, export, validate
- `contactsAPI` — CRUD, bulk, search, tags
- `opportunitiesAPI` — CRUD, move stage, pipelines
- `messagesAPI` — send SMS/email/WhatsApp, list, templates
- `templatesAPI` — list, clone
- `registryAPI` — triggers, actions, test endpoints
- `analyticsAPI` — summary, per-workflow stats

## Design System

Pure CSS with custom properties in `index.css`:
- Font: Inter (body), Outfit (headings)
- Theme: Light (#f4f5f7 canvas, #1a2035 nav)
- Components: `.btn-*`, `.card`, `.badge-*`, `.wf-node`, `.modal`, `.toast-*`
