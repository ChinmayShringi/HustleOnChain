"""Audit: malicious-input smoke tests for the Docker sandbox.

Each test is skipped if docker is unavailable or the image cannot be pulled.
The sandbox lives in grader/app/sandbox.py and is not modified by the auditor.
"""

from __future__ import annotations

import os
import shutil
import subprocess

import pytest

from grader.app.sandbox import run_sandbox

pytestmark = pytest.mark.skipif(
    shutil.which("docker") is None, reason="docker not installed"
)


def _docker_up() -> bool:
    try:
        p = subprocess.run(["docker", "info"], capture_output=True, timeout=5)
        return p.returncode == 0
    except Exception:
        return False


if not _docker_up():
    pytestmark = pytest.mark.skip(reason="docker daemon not reachable")


PWN_MARKER = "/tmp/pwn_agentwork_audit_marker"

TRIVIAL_TEST = b"""
import pytest
from solution import run

def test_run():
    run()
    assert True
"""


def _cleanup_pwn():
    try:
        if os.path.exists(PWN_MARKER):
            os.remove(PWN_MARKER)
    except Exception:
        pass


def test_malicious_write_does_not_escape_container():
    """A write attempt from inside sandbox must not land on host."""
    _cleanup_pwn()
    # Attempt host-path write via subprocess shell invocation from inside the sandbox.
    solution = (
        "import subprocess\n"
        "def run():\n"
        f"    subprocess.call(['sh', '-c', 'touch {PWN_MARKER}'])\n"
    ).encode()
    run_sandbox(solution, TRIVIAL_TEST, timeout_s=30)
    assert not os.path.exists(PWN_MARKER), "host filesystem was written from sandbox"
    _cleanup_pwn()


def test_infinite_loop_times_out_cleanly():
    """Infinite loop must be killed by the timeout without hanging the process."""
    solution = b"""
def run():
    while True:
        pass
"""
    result = run_sandbox(solution, TRIVIAL_TEST, timeout_s=5)
    assert result["passed"] is False


def test_network_access_blocked_when_prebuilt_image():
    """If the prebuilt image is present, --network=none must prevent requests."""
    import subprocess as sp
    img = os.environ.get("SANDBOX_IMAGE", "agentwork-sandbox")
    p = sp.run(["docker", "image", "inspect", img], capture_output=True)
    if p.returncode != 0:
        pytest.skip(
            f"prebuilt sandbox image {img} not present; fallback uses bridge network (documented limitation)"
        )
    solution = b"""
def run():
    import urllib.request
    urllib.request.urlopen("http://example.com", timeout=3)
"""
    result = run_sandbox(solution, TRIVIAL_TEST, timeout_s=20)
    assert result["passed"] is False


def test_readonly_root_prevents_host_write():
    """Writing to /etc/hosts must fail because root fs is --read-only."""
    solution = b"""
def run():
    with open('/etc/hosts', 'w') as f:
        f.write('pwned')
"""
    result = run_sandbox(solution, TRIVIAL_TEST, timeout_s=20)
    assert result["passed"] is False


def test_bind_mount_is_readonly():
    """The /work bind is read-only; writes to /work must fail."""
    solution = b"""
def run():
    with open('/work/hacked.py','w') as f:
        f.write('x')
"""
    result = run_sandbox(solution, TRIVIAL_TEST, timeout_s=20)
    assert result["passed"] is False
