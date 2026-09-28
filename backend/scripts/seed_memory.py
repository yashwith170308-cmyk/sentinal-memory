import sys
import os
import json
import logging

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.config import settings
from backend.app.services.hindsight_service import hindsight_service
from backend.app.models.database import init_db, SessionLocal, AlertRecord
from backend.scripts.seed_data import SYNTHETIC_INCIDENTS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_memory")

def seed_hindsight_memory():
    logger.info("==================================================")
    logger.info("SEEDING HINDSIGHT MEMORY BANK: " + settings.HINDSIGHT_BANK_ID)
    logger.info("Base URL: " + settings.HINDSIGHT_BASE_URL)
    logger.info("==================================================")

    init_db()

    hindsight_available = hindsight_service.is_available()
    if not hindsight_available:
        logger.warning("WARNING: Hindsight API is currently unavailable or unconfigured.")
        logger.warning("Incidents will be populated into the local database for offline simulation.")
    else:
        logger.info("Hindsight service connected successfully.")

    success_count = 0
    with SessionLocal() as db:
        for inc in SYNTHETIC_INCIDENTS:
            doc_id = inc["incident_id"]
            metadata = {
                "incident_id": inc["incident_id"],
                "severity": inc["severity"],
                "category": inc["category"],
                "host": inc["host"],
                "process": inc["process"],
                "parent_process": inc["parent_process"],
                "outcome": inc["outcome"],
                "timestamp": inc["timestamp"],
                "source": "synthetic_seed_v1"
            }

            # 1. Retain into Hindsight if available
            retained = False
            if hindsight_available:
                try:
                    result = hindsight_service.retain(
                        content=inc["content"],
                        document_id=doc_id,
                        metadata=metadata,
                        tags=inc["tags"],
                        context=f"Historical Incident {inc['incident_id']}: {inc['title']}"
                    )
                    retained = result.get("success", False)
                    if retained:
                        logger.info(f"✓ Retained in Hindsight: {doc_id} - {inc['title']}")
                        success_count += 1
                    else:
                        logger.warning(f"✕ Failed to retain {doc_id} in Hindsight: {result.get('reason')}")
                except Exception as e:
                    logger.error(f"Error retaining {doc_id}: {e}")

            # 2. Save reference into local database
            existing = db.query(AlertRecord).filter(AlertRecord.id == doc_id).first()
            if not existing:
                alert_rec = AlertRecord(
                    id=doc_id,
                    host=inc["host"],
                    severity=inc["severity"],
                    process=inc["process"],
                    parent_process=inc["parent_process"],
                    command=inc["command"],
                    destination=inc["destination"],
                    raw_payload=json.dumps(inc)
                )
                db.add(alert_rec)

        db.commit()

    logger.info("==================================================")
    logger.info(f"SEEDING COMPLETE: {success_count}/{len(SYNTHETIC_INCIDENTS)} incidents retained in Hindsight.")
    logger.info(f"Local database initialized with all {len(SYNTHETIC_INCIDENTS)} incidents.")
    logger.info("==================================================")

if __name__ == "__main__":
    seed_hindsight_memory()
