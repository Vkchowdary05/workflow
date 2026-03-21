# Quantixone Workflow Builder — Frontend

React + ReactFlow frontend for the Quantixone Workflow Builder.

## Quick Start

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API URL |

## Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `UploadPage` | Upload JSON, validate DAG, preview, load from DB |
| `/builder` | `BuilderPage` | ReactFlow canvas + sidebar panels + topbar |

## Key Components

| Component | Description |
|-----------|-------------|
| `FlowCanvas` | ReactFlow wrapper with MiniMap and Controls |
| `CustomNodes` | 4 draggable node types: Trigger, Action, Condition, Delay |
| `ContactsPanel` | CRM contacts with drag-and-drop actions |
| `OpportunitiesPanel` | CRM deals with drag-and-drop actions |
| `ExecutePanel` | Drop zone for full workflow execution |
| `ExecutionLogs` | Step log timeline viewer |
| `CollapsiblePanel` | Shared sidebar section wrapper |
| `Toast` | Notification toast container |

## Utils

| File | Exports |
|------|---------|
| `parser.js` | `extractWorkflow`, `validateWorkflow`, `parseWorkflowToReactFlow`, `prepareForSave` |
| `dragHelpers.js` | `parseDropData` |
| `api.js` | `workflowAPI`, `contactsAPI`, `opportunitiesAPI`, `messagesAPI`, `registryAPI` |

## Build for Production

```bash
npm run build
# Output → dist/
```

Deploy to Vercel using the included `vercel.json`.
