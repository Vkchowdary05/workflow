from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import connect_to_database, close_database_connection
from app.routes.workflow_routes import router as workflow_router
from app.routes.execution_routes import router as execution_router
from app.routes.contact_routes import router as contact_router
from app.routes.opportunity_routes import router as opportunity_router


# ✅ DEFINE FIRST
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle for the FastAPI application."""
    await connect_to_database()
    yield
    await close_database_connection()


# ✅ THEN USE IT
app = FastAPI(
    title="Workflow Automation Backend",
    description="A Zapier-like workflow automation system with DAG-based execution engine.",
    version="1.0.0",
    lifespan=lifespan,
)


# ✅ CORS (correct position)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "API is running"}


# ── Routers ──
app.include_router(workflow_router, prefix="/workflows", tags=["Workflows"])
app.include_router(execution_router, prefix="/workflows", tags=["Executions"])
app.include_router(contact_router, prefix="/contacts", tags=["Contacts"])
app.include_router(opportunity_router, prefix="/opportunities", tags=["Opportunities"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "message": "Workflow Automation Backend is running"}