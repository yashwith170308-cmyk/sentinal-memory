from fastapi import APIRouter
from backend.app.config import settings
from backend.app.services.hindsight_service import hindsight_service
from backend.app.services.llm_service import llm_service

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health():
    hindsight_info = hindsight_service.check_health()
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "hindsight": {
            "status": hindsight_info.get("status"),
            "bank_id": settings.HINDSIGHT_BANK_ID,
            "base_url": settings.HINDSIGHT_BASE_URL,
            "connected": hindsight_info.get("status") == "CONNECTED",
            "details": hindsight_info.get("reason")
        },
        "llm": {
            "model": settings.LLM_MODEL,
            "provider": "Groq" if llm_service.is_available() else "SOC Defensive Engine (Fallback)",
            "ready": True
        }
    }
