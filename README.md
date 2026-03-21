# Workflow Automation Backend

A high-performance backend system for a Zapier-like workflow automation platform, built with FastAPI and MongoDB. This system allows users to define, validate, and execute complex workflows structured as Directed Acyclic Graphs (DAGs).

## 🚀 Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) - Modern, fast Python web framework.
- **Database**: [MongoDB (Atlas)](https://www.mongodb.com/) - NoSQL database for flexible JSON-level schema.
- **Driver**: [Motor](https://motor.readthedocs.io/) - Async Python driver for MongoDB.
- **Validation**: [Pydantic](https://docs.pydantic.dev/) - Data validation and parsing.

## 🏗️ Architecture Layering

1. **Routes (`app/routes/`)**: FastAPI endpoints and Pydantic validation.
2. **Services (`app/services/`)**: Core application logic (workflow DAG validation, execution engine).
3. **Repositories (`app/repositories/`)**: Async MongoDB operations using Motor.

## 🛠️ Setup & Installation

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```
2. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/workflow_automation?retryWrites=true&w=majority
   ```
3. **Run the Server**
   ```bash
   uvicorn app.main:app --reload
   ```
4. **Interactive Docs**: `http://localhost:8000/docs`

---

## 📡 API Reference & cURL Examples

Below is a complete reference of the available APIs and how to test them using `curl` from your terminal.

> **Note:** Replace `{workflow_id}`, `{contact_id}`, etc., with actual MongoDB ObjectIds returned by the `POST` endpoints.


### 1. Workflows API

**Create a Workflow** (with DAG validation)
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
        "config": { "to": "{{contact.email}}" },
        "on_success": "step_2"
      },
      {
        "id": "step_2",
        "type": "delay",
        "config": { "duration": 1, "unit": "days" },
        "on_complete": "step_3"
      },
      {
        "id": "step_3",
        "type": "action",
        "action_type": "add_tag",
        "config": { "tags": ["onboarded"] }
      }
    ]
  }'
```

**List Workflows**
```bash
curl -X GET http://localhost:8000/workflows
```

**Get Workflow by ID**
```bash
curl -X GET http://localhost:8000/workflows/{workflow_id}
```

**Update Workflow**
```bash
curl -X PUT http://localhost:8000/workflows/{workflow_id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Onboarding Workflow"
  }'
```

**Delete Workflow**
```bash
curl -X DELETE http://localhost:8000/workflows/{workflow_id}
```


### 2. Executions API

**Trigger an Execution** (Simulates running the workflow)
```bash
curl -X POST http://localhost:8000/workflows/{workflow_id}/execute
```

**List Executions for a Workflow**
```bash
curl -X GET http://localhost:8000/workflows/{workflow_id}/executions
```

**Get a Specific Execution**
```bash
curl -X GET http://localhost:8000/workflows/{workflow_id}/executions/{execution_id}
```


### 3. Contacts API (CRM)

**Create Contact**
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

**List Contacts**
```bash
curl -X GET http://localhost:8000/contacts
```

**Get Contact by ID**
```bash
curl -X GET http://localhost:8000/contacts/{contact_id}
```

**Update Contact**
```bash
curl -X PUT http://localhost:8000/contacts/{contact_id} \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "555-9999"
  }'
```

**Delete Contact**
```bash
curl -X DELETE http://localhost:8000/contacts/{contact_id}
```

**Add Tags to Contact** (Deduplicates automatically in MongoDB via `$addToSet`)
```bash
curl -X POST http://localhost:8000/contacts/{contact_id}/tags \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["vip", "engaged"]
  }'
```


### 4. Opportunities API (CRM Pipelines)

**Create Opportunity**
```bash
curl -X POST http://localhost:8000/opportunities \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Enterprise Deal",
    "contact_id": "{contact_id}",
    "stage": "new"
  }'
```

**List Opportunities**
```bash
curl -X GET http://localhost:8000/opportunities
```

**Get Opportunity by ID**
```bash
curl -X GET http://localhost:8000/opportunities/{opportunity_id}
```

**Move Opportunity Stage**
```bash
curl -X PUT http://localhost:8000/opportunities/{opportunity_id}/move \
  -H "Content-Type: application/json" \
  -d '{
    "stage": "qualified"
  }'
```
