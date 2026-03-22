from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import connect_to_database, close_database_connection
from app.routes.workflow_routes import router as workflow_router
from app.routes.execution_routes import router as execution_router
from app.routes.contact_routes import router as contact_router
from app.routes.opportunity_routes import router as opportunity_router
from app.routes.message_routes import router as message_router
from app.routes.registry_routes import router as registry_router
from app.routes.webhook_routes import router as webhook_router
from app.routes.analytics_routes import router as analytics_router
from app.routes.template_routes import router as template_router


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
    allow_origins=["http://localhost:5173", "https://*.vercel.app", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routers ──
app.include_router(workflow_router, prefix="/api/workflows", tags=["Workflows"])
app.include_router(execution_router, prefix="/api/workflows", tags=["Executions"])
app.include_router(contact_router, prefix="/api/contacts", tags=["Contacts"])
app.include_router(registry_router, prefix="/api/registry", tags=["Registry"])
app.include_router(message_router, prefix="/api/messages", tags=["Messages"])
app.include_router(opportunity_router, prefix="/api/opportunities", tags=["Opportunities"])
app.include_router(webhook_router, prefix="/api/webhooks", tags=["Webhooks"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(template_router, prefix="/api/templates", tags=["Templates"])


@app.get("/health")
async def health_check():
    """Basic health check endpoint."""
    from app.core.database import get_database
    db_status = "ok" if get_database() is not None else "error"
    return {
        "status": "ok",
        "service": "Quantixone Workflow API",
        "version": "1.0.0",
        "db_status": db_status
    }