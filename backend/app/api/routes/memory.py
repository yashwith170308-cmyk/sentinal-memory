from fastapi import APIRouter, Query
from typing import List, Dict, Any, Optional
from backend.app.config import settings
from backend.app.services.hindsight_service import hindsight_service
from backend.app.models.database import SessionLocal, FeedbackRecord, AlertRecord
from backend.scripts.seed_data import SYNTHETIC_INCIDENTS

router = APIRouter(prefix="/memory", tags=["Memory"])

@router.get("/search")
def search_memory(query: str = Query(..., description="Semantic search query into Hindsight memory")):
    """
    Directly queries Hindsight memory bank using official client.recall(...)
    """
    if not hindsight_service.is_available():
        # Fallback keyword match across synthetic dataset and feedbacks
        matched = []
        q_lower = query.lower()
        for inc in SYNTHETIC_INCIDENTS:
            text = (inc["content"] + " " + inc["title"] + " " + " ".join(inc["tags"])).lower()
            if any(term in text for term in q_lower.split() if len(term) > 3):
                matched.append({
                    "id": f"mem-{inc['incident_id']}",
                    "text": inc["content"],
                    "document_id": inc["incident_id"],
                    "metadata": {"incident_id": inc["incident_id"], "outcome": inc["outcome"]},
                    "tags": inc["tags"],
                    "score": 0.88
                })
        return {
            "source": "SIMULATION_FALLBACK",
            "memory_status": "UNAVAILABLE",
            "results": matched[:5],
            "count": len(matched)
        }

    results = hindsight_service.recall(query=query, max_tokens=2048)
    return {
        "source": "HINDSIGHT_LIVE_API",
        "memory_status": "CONNECTED",
        "bank_id": settings.HINDSIGHT_BANK_ID,
        "results": results,
        "count": len(results)
    }

@router.get("/stats")
def get_memory_stats():
    """
    Returns aggregated memory statistics for the SOC dashboard and Memory Explorer.
    """
    health = hindsight_service.check_health()
    feedback_count = 0
    with SessionLocal() as db:
        feedback_count = db.query(FeedbackRecord).count()

    total_incidents = len(SYNTHETIC_INCIDENTS)
    false_positives = sum(1 for inc in SYNTHETIC_INCIDENTS if "false_positive" in inc.get("tags", []))
    true_positives = total_incidents - false_positives

    return {
        "hindsight_connected": health.get("status") == "CONNECTED",
        "bank_id": settings.HINDSIGHT_BANK_ID,
        "base_url": settings.HINDSIGHT_BASE_URL,
        "total_incidents_seeded": total_incidents,
        "retained_feedbacks_count": feedback_count,
        "true_positives_recorded": true_positives,
        "false_positives_learned": false_positives,
        "active_patterns": [
            "Word -> PowerShell Macro Execution",
            "Encoded PowerShell Base64 Payloads",
            "Enterprise Scheduled Backup Verification",
            "Cobalt Strike Beacon Telemetry",
            "Credential Harvesting & Mimikatz Detection",
            "EnterpriseDocGen Finance Add-in Exemption"
        ]
    }

@router.get("/graph")
def get_memory_graph():
    """
    Constructs graph nodes and edges representing the relationships between:
    Incidents <-> Techniques <-> Hosts <-> Indicators <-> Outcomes <-> Analyst Feedback
    """
    nodes = []
    edges = []
    seen_nodes = set()

    def add_node(node_id: str, label: str, node_type: str, metadata: dict = None):
        if node_id not in seen_nodes:
            seen_nodes.add(node_id)
            nodes.append({
                "id": node_id,
                "label": label,
                "type": node_type,
                "metadata": metadata or {}
            })

    def add_edge(source: str, target: str, label: str):
        edges.append({
            "id": f"{source}-{target}",
            "source": source,
            "target": target,
            "label": label
        })

    # Graph elements from synthetic incidents
    for inc in SYNTHETIC_INCIDENTS:
        inc_id = inc["incident_id"]
        add_node(inc_id, inc_id, "INCIDENT", {"title": inc["title"], "severity": inc["severity"]})

        # Host node
        host_id = f"HOST-{inc['host']}"
        add_node(host_id, inc["host"], "HOST")
        add_edge(inc_id, host_id, "occurred_on")

        # Process/Technique node
        tech_id = f"TECH-{inc['parent_process']}->{inc['process']}"
        add_node(tech_id, f"{inc['parent_process']} -> {inc['process']}", "TECHNIQUE")
        add_edge(inc_id, tech_id, "utilized")

        # Outcome node
        is_fp = "false_positive" in inc.get("tags", [])
        outcome_id = f"OUTCOME-{'FP' if is_fp else 'TP'}"
        outcome_label = "False Positive / Whitelisted" if is_fp else "Confirmed Threat / Isolated"
        add_node(outcome_id, outcome_label, "OUTCOME")
        add_edge(inc_id, outcome_id, "resolved_as")

        # Destination node if external
        if inc.get("destination") and inc["destination"] != "None":
            dest_id = f"NET-{inc['destination'].split(':')[0]}"
            add_node(dest_id, inc["destination"], "INDICATOR")
            add_edge(inc_id, dest_id, "communicated_with")

    # Connect feedbacks if any
    try:
        with SessionLocal() as db:
            feedbacks = db.query(FeedbackRecord).all()
            for fb in feedbacks:
                fb_id = f"FB-{fb.id}"
                add_node(fb_id, f"Analyst: {fb.verdict}", "FEEDBACK", {"comments": fb.comments})
                if fb.alert_id:
                    add_edge(fb_id, fb.alert_id, "feedback_for")
    except Exception:
        pass

    return {
        "nodes": nodes,
        "edges": edges,
        "total_nodes": len(nodes),
        "total_edges": len(edges)
    }

@router.post("/reflect")
def reflect_memory(query: str = Query(..., description="Query for Hindsight reflection synthesis")):
    """
    Executes Hindsight reflect operation to synthesize a mental model.
    """
    reflection = hindsight_service.reflect(query=query)
    return {
        "query": query,
        "reflection": reflection or "No synthesis available for this query.",
        "status": "SUCCESS" if reflection else "NO_RESULT"
    }
