import os
import sys

root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, "backend")
for d in [root_dir, backend_dir]:
    if d not in sys.path:
        sys.path.insert(0, d)

try:
    from backend.app.main import app
except ImportError:
    from app.main import app

__all__ = ["app"]
