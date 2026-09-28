"""
Sentinel Memory - Application Package
Ensures package compatibility whether run from the project root
or from the backend/ service directory (e.g., on Vercel Services).
"""
import os
import sys
import types
from pathlib import Path

# Ensure 'backend' package is resolvable regardless of working directory
if "backend" not in sys.modules:
    backend_dir = str(Path(__file__).resolve().parent.parent)
    parent_dir = str(Path(backend_dir).parent)
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)
    try:
        import backend  # noqa: F401
    except ImportError:
        pkg = types.ModuleType("backend")
        pkg.__path__ = [backend_dir]
        sys.modules["backend"] = pkg
