# Workflow Automation Backend

A high-performance backend system for a Zapier-like workflow automation platform, built with FastAPI and MongoDB. This system allows users to define, validate, and execute complex workflows structured as Directed Acyclic Graphs (DAGs).

## 🚀 Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) - A modern, fast (high-performance), web framework for building APIs with Python 3.8+ based on standard Python type hints.
- **Database**: [MongoDB (Atlas)](https://www.mongodb.com/) - NoSQL database used for storing highly flexible JSON-like workflow schemas and execution logs.
- **Database Driver**: [Motor](https://motor.readthedocs.io/) - Asynchronous Python driver for MongoDB, ensuring non-blocking database queries in the async event loop.
- **Data Validation**: [Pydantic](https://docs.pydantic.dev/) - Data validation and settings management using python type annotations.
- **Environment Management**: [python-dotenv](https://saurabh-kumar.com/python-dotenv/) - For loading environment variables from a `.env` file.

## 🏗️ Architecture Layering

The codebase strictly adheres to a layered architecture pattern to separate concerns and ensure maintainability:

1. **Routes Layer (`app/routes/`)**: Handles incoming HTTP requests, validates payloads using Pydantic models, and returns responses. Contains no business logic.
2. **Service Layer (`app/services/`)**: The core of the application. Contains all business logic, workflow validation, cycle detection, and the DAG execution engine.
3. **Repository Layer (`app/repositories/`)**: Manages all direct database interactions. Ensures the service layer is decoupled from MongoDB specifics.
4. **Database Core (`app/core/database.py`)**: Manages the Motor client lifecycle asynchronously using FastAPI's lifespan events.

## 🌟 Core Features

- **Workflow Management**: Create, Read, Update, and Delete workflow configurations.
- **DAG Validation Engine**: Validates workflows before saving:
  - Ensures unique step IDs.
  - Verifies all step references (e.g., `on_success`, `branches`) link to existing steps.
  - Implements Depth-First Search (DFS) to prevent circular dependencies (cycles) in the workflow graph.
- **Execution Engine**: Simulates the execution of a workflow step-by-step:
  - Handles sequential actions.
  - Simulates condition branching (`true`/`false`).
  - Simulates delays.
  - Generates comprehensive execution logs for each step.
- **Domain Modules**:
  - **Contacts**: Full CRUD capabilities and tag management (with deduplication).
  - **Opportunities (CRM)**: Pipeline management enabling users to track contact deals through various stages.

## 📂 Project Structure

```text
app/
├── core/
│   ├── database.py         # MongoDB connection lifecycle events
├── models/                 # Pydantic schemas for data validation
│   ├── contact.py
│   ├── execution.py
│   ├── opportunity.py
│   └── workflow.py
├── repositories/           # Database operations
│   ├── contact_repo.py
│   ├── execution_repo.py
│   ├── opportunity_repo.py
│   └── workflow_repo.py
├── routes/                 # FastAPI API endpoints
│   ├── contact_routes.py
│   ├── execution_routes.py
│   ├── opportunity_routes.py
│   └── workflow_routes.py
├── services/               # Business logic and DAG Engine
│   ├── action_service.py
│   ├── contact_service.py
│   ├── execution_service.py
│   ├── opportunity_service.py
│   ├── validation_service.py
│   └── workflow_service.py
└── main.py                 # Application entry point
```

## 🛠️ Setup & Installation

### 1. Prerequisites
- Python 3.10+
- A MongoDB cluster (e.g., MongoDB Atlas)

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file in the root directory (alongside `requirements.txt`) and provide your MongoDB connection string:
```env
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/workflow_automation?retryWrites=true&w=majority
```

### 4. Run the Server
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

### 5. API Documentation
Once the server is running, visit the interactive Swagger UI at:
- `http://localhost:8000/docs`
