import os
import sys
import traceback

root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, "backend")
for d in [root_dir, backend_dir]:
    if d not in sys.path:
        sys.path.insert(0, d)

try:
    try:
        from backend.app.main import app
    except ImportError:
        from app.main import app
except Exception as e:
    tb = traceback.format_exc()
    from fastapi import FastAPI
    from fastapi.responses import PlainTextResponse
    app = FastAPI()
    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    def error_handler(path: str):
        return PlainTextResponse(f"ROOT_MAIN_STARTUP_ERROR:\n{tb}", status_code=500)

__all__ = ["app"]
