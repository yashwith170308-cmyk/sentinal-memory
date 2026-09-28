import pytest
import json
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.schemas.alert import AlertInput
from backend.app.schemas.feedback import FeedbackInput
from backend.app.services.investigation_service import investigation_service
from backend.app.services.feedback_service import feedback_service
from backend.app.services.hindsight_service import hindsight_service
from backend.app.services.llm_service import llm_service

client = TestClient(app)

def test_health_endpoint():
    """Validates health check API endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "hindsight" in data
    assert "llm" in data

def test_prebuilt_alerts_endpoint():
    """Validates prebuilt demo alerts list."""
    response = client.get("/api/alerts/prebuilt")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
    assert data[0]["alert"]["alert_id"] == "ALT-1042"

def test_investigation_service_pipeline():
    """Tests the investigation pipeline with structured alert input."""
    alert = AlertInput(
        alert_id="TEST-ALT-01",
        host="TEST-PC-01",
        severity="HIGH",
        process="powershell.exe",
        parent_process="winword.exe",
        command="powershell.exe -enc VGVzdENvbW1hbmQ=",
        destination="198.51.100.99:443"
    )
    result = investigation_service.investigate(alert)
    assert result.alert_id == "TEST-ALT-01"
    assert result.risk_level in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"]
    assert 0.0 <= result.confidence <= 1.0
    assert len(result.key_indicators) > 0
    assert len(result.recommended_actions) > 0
    assert result.memory_status in ["CONNECTED", "UNAVAILABLE", "NO_RELEVANT_MEMORIES"]

def test_investigation_query_construction():
    """Ensures query constructor creates rich semantic query."""
    alert = AlertInput(
        alert_id="TEST-ALT-02",
        host="FINANCE-PC-02",
        severity="HIGH",
        process="powershell.exe",
        parent_process="winword.exe",
        command="powershell.exe -enc SQBFAFgA... -Target backup",
        destination="185.1.2.3:443"
    )
    query = investigation_service.construct_recall_query(alert)
    assert "powershell.exe" in query
    assert "winword.exe" in query
    assert "encoded" in query.lower()

def test_feedback_retention_flow():
    """Tests submitting analyst feedback and local DB + memory retention."""
    fb_input = FeedbackInput(
        alert_id="TEST-ALT-01",
        verdict="FALSE_POSITIVE",
        comments="Approved document sync script verified by senior SOC analyst.",
        analyst_name="Test Analyst",
        action_taken="Whitelisted in corporate EDR"
    )
    response = feedback_service.process_feedback(fb_input)
    assert response.success is True
    assert response.alert_id == "TEST-ALT-01"
    assert response.feedback_id.startswith("FB-")

def test_no_memory_scenario():
    """Tests investigation behavior when no memories are recalled."""
    alert_dict = {
        "alert_id": "ALT-NEW-999",
        "host": "ISOLATED-LAB-01",
        "severity": "MEDIUM",
        "process": "notepad.exe",
        "parent_process": "cmd.exe",
        "command": "notepad.exe readme.txt"
    }
    # Pass empty memories list
    analysis = llm_service.analyze_alert(alert_dict, recalled_memories=[])
    assert analysis["memory_used"] is False
    assert analysis["memory_count"] == 0
    assert "CURRENT ALERT EVIDENCE" in analysis["reasoning"][0]

def test_hindsight_unavailable_graceful_handling():
    """Verifies Hindsight health and recall safely handle unconfigured/offline states."""
    # When api_key is None, it should return UNAVAILABLE without throwing
    health = hindsight_service.check_health()
    assert health["status"] in ["CONNECTED", "UNAVAILABLE"]
    # Recall with unavailable or empty returns empty list safely
    memories = hindsight_service.recall("test query")
    assert isinstance(memories, list)

def test_malformed_llm_json_handling():
    """Verifies that malformed LLM output falls back to SOC defensive reasoning engine."""
    alert_dict = {
        "alert_id": "ALT-MALFORM-01",
        "host": "DEV-MACHINE-05",
        "severity": "HIGH",
        "process": "powershell.exe",
        "parent_process": "winword.exe",
        "command": "powershell.exe -enc AAAA"
    }
    # Pass invalid JSON string to parser
    parsed = llm_service._parse_and_validate("This is not valid json at all", alert_dict, [])
    assert parsed["alert_id"] == "ALT-MALFORM-01"
    assert parsed["risk_level"] in ["HIGH", "MEDIUM"]
    assert len(parsed["recommended_actions"]) > 0

def test_api_routes():
    """Validates core API endpoints respond with correct status codes."""
    # Prebuilt
    res = client.get("/api/alerts/prebuilt")
    assert res.status_code == 200

    # Memory Stats
    res = client.get("/api/memory/stats")
    assert res.status_code == 200
    assert "total_incidents_seeded" in res.json()

    # Memory Graph
    res = client.get("/api/memory/graph")
    assert res.status_code == 200
    assert "nodes" in res.json()
    assert "edges" in res.json()

    # Demo Comparison
    res = client.get("/api/demo/comparison")
    assert res.status_code == 200
    assert "without_memory" in res.json()
    assert "with_hindsight_memory" in res.json()

    # Incidents List
    res = client.get("/api/incidents")
    assert res.status_code == 200
    assert len(res.json()) > 0
