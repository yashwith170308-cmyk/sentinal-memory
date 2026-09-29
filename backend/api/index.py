import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
parent_dir = os.path.dirname(backend_dir)
for d in [backend_dir, parent_dir]:
    if d not in sys.path:
        sys.path.insert(0, d)

from app.main import app

__all__ = ["app"]
