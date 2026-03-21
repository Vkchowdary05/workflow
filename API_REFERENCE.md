# API Reference

Complete reference for all backend endpoints with cURL examples.

> **Base URL**: `http://localhost:8000`
> Replace `{id}` placeholders with actual MongoDB ObjectIDs returned by POST endpoints.

---

## 1. Workflows API

### Create Workflow

```bash
curl -X POST http://localhost:8000/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Onboarding Workflow",
    "description": "Triggered when contact is created",
    "trigger": {
      "type": "contact_created",
      "label": "Contact Created"
    },
    "steps": [
      {
        "id": "step_1",
        "type": "action",
        "action_type": "send_email",
        "label": "Welcome Email",
        "config": { "to": "{{contact.email}}", "subject": "Welcome!" },
        "on_success": "step_2"
      },
      {
        "id": "step_2",
        "type": "delay",
        "label": "Wait 1 Day",
        "config": { "duration": 1, "unit": "days" },
        "on_complete": "step_3"
      },
      {
        "id": "step_3",
        "type": "action",
        "action_type": "add_tag",
        "label": "Tag as Onboarded",
        "config": { "tags": ["onboarded"] }
      }
    ]
  }'
```

### Import Workflow (Quantixone JSON Format)

Accepts both **nested** (`{ workflow: { meta, trigger, steps } }`) and **flat** formats.

```bash
curl -X POST http://localhost:8000/workflows/import \
  -H "Content-Type: application/json" \
  -d @workflow_export_import.json
```

**Response:**
```json
{ "workflow_id": "...", "name": "Imported Workflow", "imported": true }
```

### List Workflows

```bash
curl http://localhost:8000/workflows
```

### Get Workflow by ID

```bash
curl http://localhost:8000/workflows/{workflow_id}
```

### Update Workflow

```bash
curl -X PUT http://localhost:8000/workflows/{workflow_id} \
  -H "Content-Type: application/json" \
  -d '{ "name": "Updated Name" }'
```

### Delete Workflow

```bash
curl -X DELETE http://localhost:8000/workflows/{workflow_id}
```

### Activate / Deactivate

```bash
curl -X POST http://localhost:8000/workflows/{workflow_id}/activate
curl -X POST http://localhost:8000/workflows/{workflow_id}/deactivate
```

**Response:**
```json
{ "workflow_id": "...", "status": "active" }
```

---

## 2. Execution API

### Execute a Workflow

Triggers the DAG walker. Walks through every step, simulates actions, records step logs.

```bash
curl -X POST http://localhost:8000/workflows/{workflow_id}/execute
```

**Response:**
```json
{
  "execution_id": "...",
  "workflow_id": "...",
  "status": "success",
  "step_logs": [
    {
      "step_id": "step_1",
      "label": "Welcome Email",
      "status": "success",
      "message": "Email sent to {{contact.email}}",
      "timestamp": "2026-03-21T12:00:00Z"
    }
  ]
}
```

### List Executions

```bash
curl http://localhost:8000/workflows/{workflow_id}/executions
```

### Get Execution Details

```bash
curl http://localhost:8000/workflows/{workflow_id}/executions/{execution_id}
```

---

## 3. Contacts API

### Create Contact

```bash
curl -X POST http://localhost:8000/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "555-0199",
    "tags": ["new_lead"]
  }'
```

### Bulk Create Contacts

```bash
curl -X POST http://localhost:8000/contacts/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "contacts": [
      { "name": "Alice", "email": "alice@example.com", "tags": ["imported"] },
      { "name": "Bob", "email": "bob@example.com", "tags": ["imported"] }
    ]
  }'
```

**Response:** `{ "created": 2 }`

### List Contacts

```bash
curl http://localhost:8000/contacts
```

### Get Contact by ID

```bash
curl http://localhost:8000/contacts/{contact_id}
```

### Update Contact

```bash
curl -X PUT http://localhost:8000/contacts/{contact_id} \
  -H "Content-Type: application/json" \
  -d '{ "phone": "555-9999" }'
```

### Delete Contact

```bash
curl -X DELETE http://localhost:8000/contacts/{contact_id}
```

### Add Tags to Contact

Tags are deduplicated automatically via MongoDB `$addToSet`.

```bash
curl -X POST http://localhost:8000/contacts/{contact_id}/tags \
  -H "Content-Type: application/json" \
  -d '{ "tags": ["vip", "engaged"] }'
```

---

## 4. Opportunities API

### Create Opportunity

```bash
curl -X POST http://localhost:8000/opportunities \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Enterprise Deal",
    "contact_id": "{contact_id}",
    "stage": "new"
  }'
```

### List Opportunities

```bash
curl http://localhost:8000/opportunities
```

### Get Pipeline Stages

Returns the list of available pipeline stages.

```bash
curl http://localhost:8000/opportunities/pipelines
```

**Response:**
```json
{
  "pipelines": [{
    "id": "default",
    "name": "Sales Pipeline",
    "stages": [
      { "id": "new", "label": "New", "order": 1 },
      { "id": "qualified", "label": "Qualified", "order": 2 },
      { "id": "proposal", "label": "Proposal", "order": 3 },
      { "id": "cold", "label": "Cold", "order": 4 },
      { "id": "won", "label": "Won", "order": 5 },
      { "id": "lost", "label": "Lost", "order": 6 }
    ]
  }]
}
```

### Get Opportunity by ID

```bash
curl http://localhost:8000/opportunities/{opportunity_id}
```

### Update Opportunity

```bash
curl -X PUT http://localhost:8000/opportunities/{opportunity_id} \
  -H "Content-Type: application/json" \
  -d '{ "name": "Updated Deal Name" }'
```

### Move Opportunity Stage

```bash
curl -X PUT http://localhost:8000/opportunities/{opportunity_id}/move \
  -H "Content-Type: application/json" \
  -d '{ "stage": "qualified" }'
```

### Delete Opportunity

```bash
curl -X DELETE http://localhost:8000/opportunities/{opportunity_id}
```

---

## 5. Messages API

All messages are **simulated** — they are persisted to the `messages` MongoDB collection but not actually sent to any external service.

### Send SMS

```bash
curl -X POST http://localhost:8000/messages/sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "555-0199",
    "body": "Hello from Quantixone!",
    "contact_id": "{contact_id}"
  }'
```

### Send Email

```bash
curl -X POST http://localhost:8000/messages/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "jane@example.com",
    "subject": "Welcome to our platform",
    "body": "Hi Jane, welcome aboard!",
    "contact_id": "{contact_id}"
  }'
```

### Send WhatsApp

```bash
curl -X POST http://localhost:8000/messages/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "to": "555-0199",
    "body": "Hi from Quantixone!",
    "contact_id": "{contact_id}"
  }'
```

**Response (all channels):**
```json
{ "message_id": "uuid-here", "status": "sent", "channel": "sms" }
```

### Get Message by ID

```bash
curl http://localhost:8000/messages/{message_id}
```

---

## 6. Registry API

Static endpoints returning the available trigger and action types. Used by the frontend for validation and UI rendering.

### List Triggers

```bash
curl http://localhost:8000/registries/triggers
```

**Response:**
```json
{
  "triggers": [
    { "type": "contact_created", "label": "Contact Created", "description": "..." },
    { "type": "pipeline_stage_changed", "label": "Pipeline Stage Changed", "description": "..." },
    { "type": "webhook", "label": "Incoming Webhook", "description": "..." },
    { "type": "scheduled", "label": "Scheduled (Cron)", "description": "..." },
    { "type": "tag_added", "label": "Tag Added", "description": "..." },
    { "type": "opportunity_created", "label": "Opportunity Created", "description": "..." }
  ]
}
```

### List Actions

```bash
curl http://localhost:8000/registries/actions
```

**Response:**
```json
{
  "actions": [
    { "type": "send_email", "label": "Send Email", "applies_to": ["contact"], "description": "..." },
    { "type": "send_sms", "label": "Send SMS", "applies_to": ["contact"], "description": "..." },
    { "type": "move_pipeline", "label": "Move Pipeline Stage", "applies_to": ["opportunity"], "description": "..." }
  ]
}
```

---

## 7. Health Check

```bash
curl http://localhost:8000/health
```

**Response:**
```json
{ "status": "ok", "message": "Workflow Automation Backend is running" }
```
