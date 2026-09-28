import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.app.config import settings

logger = logging.getLogger("sentinel.hindsight")

try:
    from hindsight_client import Hindsight, RecallResponse, ReflectResponse, RetainResponse
    HINDSIGHT_CLIENT_AVAILABLE = True
except ImportError:
    Hindsight = None
    RecallResponse = None
    ReflectResponse = None
    RetainResponse = None
    HINDSIGHT_CLIENT_AVAILABLE = False
    logger.warning("hindsight-client package not found")

class HindsightService:
    def __init__(self):
        self.bank_id = settings.HINDSIGHT_BANK_ID
        self.base_url = settings.HINDSIGHT_BASE_URL
        self.api_key = settings.HINDSIGHT_API_KEY
        self._client: Optional[Any] = None
        self._is_connected = False
        self._init_client()

    def _init_client(self):
        """Initializes the official Hindsight client if credentials and SDK are available."""
        if not HINDSIGHT_CLIENT_AVAILABLE:
            logger.warning("Hindsight client is unavailable: package not installed.")
            self._is_connected = False
            return

        if not self.api_key or self.api_key.strip() == "":
            logger.info("HINDSIGHT_API_KEY is not configured. Hindsight memory will report UNAVAILABLE until configured.")
            self._is_connected = False
            self._client = None
            return

        try:
            self.base_url = self.base_url.rstrip("/")
            self._client = Hindsight(
                base_url=self.base_url,
                api_key=self.api_key
            )
            self._is_connected = True
            logger.info(f"Hindsight client initialized with base_url={self.base_url}, bank_id={self.bank_id}")
        except Exception as e:
            logger.error(f"Failed to initialize Hindsight client: {e}")
            self._is_connected = False

    def update_credentials(self, api_key: Optional[str] = None, base_url: Optional[str] = None, bank_id: Optional[str] = None):
        """Allows dynamic configuration of Hindsight credentials at runtime."""
        if api_key is not None:
            self.api_key = api_key.strip() or None
        if base_url is not None:
            self.base_url = base_url.strip() or "https://api.hindsight.vectorize.io"
        if bank_id is not None:
            self.bank_id = bank_id.strip() or "sentinel-memory"
        self._init_client()

    def is_available(self) -> bool:
        """Returns True if Hindsight client is configured and operational."""
        return self._client is not None and self._is_connected

    def check_health(self) -> Dict[str, Any]:
        """Performs a lightweight health check against Hindsight service."""
        if not self._client:
            return {
                "status": "UNAVAILABLE",
                "reason": "Hindsight client not initialized (missing API key or client package)",
                "bank_id": self.bank_id,
                "base_url": self.base_url
            }
        try:
            # Attempt to get bank config or version
            version_info = getattr(self._client, "get_version", None)
            version = version_info() if callable(version_info) else "connected"
            return {
                "status": "CONNECTED",
                "bank_id": self.bank_id,
                "base_url": self.base_url,
                "version": str(version)
            }
        except Exception as e:
            logger.warning(f"Hindsight health check warning: {e}")
            return {
                "status": "UNAVAILABLE",
                "reason": str(e),
                "bank_id": self.bank_id,
                "base_url": self.base_url
            }

    def retain(
        self,
        content: str,
        document_id: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
        tags: Optional[List[str]] = None,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retains an incident or analyst feedback into Hindsight long-term memory.
        Uses official client.retain(...)
        """
        if not self.is_available():
            logger.warning("Hindsight is unavailable. Memory retain skipped.")
            return {
                "success": False,
                "reason": "Hindsight service unavailable",
                "operation_id": None
            }

        try:
            # Metadata values in Hindsight must be strings
            clean_metadata = {k: str(v) for k, v in (metadata or {}).items()}
            response = self._client.retain(
                bank_id=self.bank_id,
                content=content,
                document_id=document_id,
                metadata=clean_metadata if clean_metadata else None,
                tags=tags if tags else None,
                context=context
            )
            op_id = getattr(response, "operation_id", None)
            if not op_id:
                op_ids = getattr(response, "operation_ids", None)
                if op_ids and len(op_ids) > 0:
                    op_id = op_ids[0]

            return {
                "success": getattr(response, "success", True),
                "operation_id": op_id,
                "items_count": getattr(response, "items_count", 1)
            }
        except Exception as e:
            logger.error(f"Error calling Hindsight retain: {e}")
            return {
                "success": False,
                "reason": str(e),
                "operation_id": None
            }

    def recall(
        self,
        query: str,
        max_tokens: int = 4096,
        budget: str = "mid",
        tags: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Recalls relevant memories from Hindsight given a contextual query.
        Uses official client.recall(...)
        """
        if not self.is_available():
            logger.warning("Hindsight is unavailable. Recall returning empty list.")
            return []

        try:
            response = self._client.recall(
                bank_id=self.bank_id,
                query=query,
                max_tokens=max_tokens,
                budget=budget,
                tags=tags
            )

            results: List[Dict[str, Any]] = []
            raw_results = getattr(response, "results", []) or []

            for r in raw_results:
                scores_obj = getattr(r, "scores", None)
                score_val = 0.85
                if scores_obj:
                    # scores may be an object with cosine, bm25, or final
                    score_val = getattr(scores_obj, "final", None) or getattr(scores_obj, "cosine", None) or 0.85

                metadata = getattr(r, "metadata", {}) or {}
                results.append({
                    "id": getattr(r, "id", ""),
                    "text": getattr(r, "text", ""),
                    "type": getattr(r, "type", "fact"),
                    "document_id": getattr(r, "document_id", None) or metadata.get("incident_id"),
                    "metadata": metadata,
                    "tags": getattr(r, "tags", []) or [],
                    "score": float(score_val) if isinstance(score_val, (int, float)) else 0.85,
                    "entities": getattr(r, "entities", []) or []
                })

            logger.info(f"Hindsight recall returned {len(results)} memories for query: '{query[:60]}...'")
            return results
        except Exception as e:
            logger.error(f"Error calling Hindsight recall: {e}")
            return []

    def reflect(self, query: str, budget: str = "low") -> Optional[str]:
        """
        Synthesizes a reasoned mental model summary across the bank using client.reflect(...)
        """
        if not self.is_available():
            return None

        try:
            response = self._client.reflect(
                bank_id=self.bank_id,
                query=query,
                budget=budget
            )
            text = getattr(response, "text", None)
            return text
        except Exception as e:
            logger.warning(f"Hindsight reflect call returned: {e}")
            return None

    def list_memories(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Lists memories from Hindsight bank for the Memory Explorer."""
        if not self.is_available():
            return []

        try:
            if hasattr(self._client, "list_memories"):
                response = self._client.list_memories(bank_id=self.bank_id, limit=limit)
                units = getattr(response, "items", None) or getattr(response, "results", None) or []
                return [
                    {
                        "id": getattr(u, "id", str(i)),
                        "text": getattr(u, "text", str(u)),
                        "type": getattr(u, "type", "memory_unit"),
                        "document_id": getattr(u, "document_id", None),
                        "metadata": getattr(u, "metadata", {}) or {},
                        "created_at": getattr(u, "created_at", None)
                    }
                    for i, u in enumerate(units)
                ]
            return []
        except Exception as e:
            logger.warning(f"Hindsight list_memories returned: {e}")
            return []

# Singleton instance
hindsight_service = HindsightService()
