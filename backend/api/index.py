import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
parent_dir = os.path.dirname(backend_dir)
for d in [backend_dir, parent_dir]:
    if d not in sys.path:
        sys.path.insert(0, d)

from backend.app_wrapper import app

__all__ = ["app"]
