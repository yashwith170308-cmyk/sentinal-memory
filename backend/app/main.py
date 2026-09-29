import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.models.database import init_db
from backend.app.api.routes import health, alerts, incidents, memory, demo, settings as settings_route

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("sentinel.main")

# Initialize database safely
try:
    init_db()
except Exception as e:
    logger.warning(f"Database initialization warning at startup: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sentinel Memory: AI-Powered SOC Analyst with Hindsight Long-Term Institutional Memory"
)

# Configure CORS
origins = [
    settings.FRONTEND_URL,
    "https://frontend-nine-rosy-88.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(alerts.router, prefix=settings.API_PREFIX)
app.include_router(incidents.router, prefix=settings.API_PREFIX)
app.include_router(memory.router, prefix=settings.API_PREFIX)
app.include_router(demo.router, prefix=settings.API_PREFIX)
app.include_router(settings_route.router, prefix=settings.API_PREFIX)

# Also expose health check without /api prefix for convenience
app.include_router(health.router)

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "tagline": "Your security team shouldn't have to rediscover the same attack twice.",
        "status": "online",
        "api_docs": "/docs",
        "health": f"{settings.API_PREFIX}/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
