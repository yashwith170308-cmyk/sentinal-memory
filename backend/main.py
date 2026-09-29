import os
import sys
import traceback

backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
for d in [backend_dir, parent_dir]:
    if d not in sys.path:
        sys.path.insert(0, d)

try:
    from app.main import app
except Exception as e:
    tb = traceback.format_exc()
    from fastapi import FastAPI
    from fastapi.responses import PlainTextResponse
    app = FastAPI()
    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    def error_handler(path: str):
        return PlainTextResponse(f"BACKEND_MAIN_STARTUP_ERROR:\n{tb}", status_code=500)

__all__ = ["app"]
