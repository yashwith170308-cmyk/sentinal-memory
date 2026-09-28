"""
Sentinel Memory - FastAPI Service Entrypoint
Delegates to app.main:app for Vercel and ASGI runners.
"""
from app.main import app

__all__ = ["app"]
