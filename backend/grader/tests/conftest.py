"""Shared fixtures: isolated DATA_DIR, settings cache reset."""

from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

import pytest

# Ensure grader package is importable when running from repo root.
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT.parent) not in sys.path:
    sys.path.insert(0, str(ROOT.parent))


@pytest.fixture(autouse=True)
def isolated_data_dir(monkeypatch):
    tmp = tempfile.mkdtemp(prefix="grader-test-")
    monkeypatch.setenv("DATA_DIR", tmp)
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    monkeypatch.setenv("GRADER_PUBLIC_BASE_URL", "http://testserver")
    # Clear settings cache so env changes take effect.
    from grader.app import config as cfg
    cfg.get_settings.cache_clear()
    yield tmp
    cfg.get_settings.cache_clear()
