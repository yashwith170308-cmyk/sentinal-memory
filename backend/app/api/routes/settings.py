from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from backend.app.config import settings
from backend.app.services.hindsight_service import hindsight_service
from backend.app.services.llm_service import llm_service

router = APIRouter(prefix="/settings", tags=["Settings"])

class SettingsPayload(BaseModel):
    hindsight_api_key: Optional[str] = None
    hindsight_base_url: Optional[str] = None
    hindsight_bank_id: Optional[str] = None
    groq_api_key: Optional[str] = None
    llm_model: Optional[str] = None

@router.get("")
def get_current_settings():
    h_health = hindsight_service.check_health()
    return {
        "hindsight": {
            "base_url": hindsight_service.base_url,
            "bank_id": hindsight_service.bank_id,
            "has_api_key": bool(hindsight_service.api_key),
            "status": h_health.get("status"),
            "reason": h_health.get("reason")
        },
        "llm": {
            "model": llm_service.model,
            "provider": "Groq" if llm_service.is_available() else "SOC Defensive Engine (Fallback)",
            "has_api_key": bool(llm_service.api_key),
            "status": "READY" if llm_service.is_available() else "FALLBACK_ACTIVE"
        }
    }

@router.post("")
def update_settings(payload: SettingsPayload):
    if payload.hindsight_api_key is not None or payload.hindsight_base_url is not None or payload.hindsight_bank_id is not None:
        hindsight_service.update_credentials(
            api_key=payload.hindsight_api_key,
            base_url=payload.hindsight_base_url,
            bank_id=payload.hindsight_bank_id
        )

    if payload.groq_api_key is not None or payload.llm_model is not None:
        llm_service.update_credentials(
            api_key=payload.groq_api_key,
            model=payload.llm_model
        )

    return get_current_settings()
