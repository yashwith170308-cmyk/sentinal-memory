import sys
import os
import logging
from datetime import datetime

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.config import settings
from backend.app.services.hindsight_service import hindsight_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("test_hindsight")

def test_hindsight_pipeline():
    logger.info("==================================================")
    logger.info("TESTING HINDSIGHT CLIENT CONNECTIVITY & PIPELINE")
    logger.info(f"Target Base URL: {settings.HINDSIGHT_BASE_URL}")
    logger.info(f"Target Bank ID: {settings.HINDSIGHT_BANK_ID}")
    logger.info("==================================================")

    # 1. Health check
    health = hindsight_service.check_health()
    logger.info(f"Health Status: {health.get('status')}")
    if health.get("status") != "CONNECTED":
        logger.warning(f"Note: Hindsight is {health.get('status')}. Reason: {health.get('reason')}")
        logger.warning("If running locally or without active cloud API key, ensure HINDSIGHT_API_KEY is in .env")
        logger.info("Graceful degradation verified: Service safely reported status without crashing.")
        return False

    # 2. Retain a test incident
    test_id = f"TEST-INC-{int(datetime.utcnow().timestamp())}"
    test_content = (
        f"TEST INCIDENT {test_id}:\n"
        "Suspicious PowerShell invocation with encoded flags on workstation TEST-HOST-99. "
        "Analyst confirmed this was an authorized pentest simulation."
    )
    metadata = {
        "incident_id": test_id,
        "type": "diagnostic_test",
        "timestamp": datetime.utcnow().isoformat()
    }
    tags = ["test", "powershell", "diagnostic"]

    logger.info(f"Attempting to retain test memory: {test_id}...")
    retain_res = hindsight_service.retain(
        content=test_content,
        document_id=test_id,
        metadata=metadata,
        tags=tags,
        context="Automated Diagnostic Test"
    )
    logger.info(f"Retain result: {retain_res}")

    # 3. Recall the test memory
    query = "Find previous incidents involving encoded PowerShell and pentest simulation on TEST-HOST-99"
    logger.info(f"Attempting to recall query: '{query}'...")
    memories = hindsight_service.recall(query=query)
    logger.info(f"Recalled {len(memories)} memories.")
    for i, m in enumerate(memories):
        logger.info(f"  Memory #{i+1}: ID={m.get('id')}, Doc={m.get('document_id')}, Score={m.get('score')}")
        logger.info(f"  Snippet: {m.get('text', '')[:100]}...")

    # 4. Optional reflect
    logger.info("Attempting to test Hindsight reflect synthesis...")
    reflection = hindsight_service.reflect(query="What is the general procedure for authorized pentests?")
    logger.info(f"Reflect result: {reflection}")

    logger.info("==================================================")
    logger.info("HINDSIGHT TEST PIPELINE COMPLETED SUCCESSFULLY")
    logger.info("==================================================")
    return True

if __name__ == "__main__":
    success = test_hindsight_pipeline()
    sys.exit(0 if success else 1)
