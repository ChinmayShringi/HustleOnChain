"""Docker-backed pytest sandbox runner.

Security invariant: every docker run MUST include --network=none. We never
silently downgrade to a networked container; if the prebuilt image is missing
we raise SandboxImageMissing so the caller sees a clear error instead of a
subtle network-access regression.
"""

from __future__ import annotations

import logging
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Dict

log = logging.getLogger(__name__)

_FAILED_RE = re.compile(r"^FAILED\s+test_solution\.py::(\S+)", re.MULTILINE)
_DEFAULT_IMAGE = os.environ.get("SANDBOX_IMAGE", "agentwork-sandbox")
_BUILD_HINT = (
    "docker build -t agentwork-sandbox -f grader/Dockerfile.sandbox grader/"
)

_warned_missing = False


class SandboxImageMissing(RuntimeError):
    """Raised when the prebuilt sandbox image is absent.

    We refuse to fall back to a networked image because that would violate the
    --network=none invariant required to safely run untrusted agent code.
    """


def _image_exists(docker: str, image: str) -> bool:
    try:
        p = subprocess.run(
            [docker, "image", "inspect", image], capture_output=True, timeout=10
        )
        return p.returncode == 0
    except Exception:
        return False


def _check_image_or_warn(docker: str, image: str) -> bool:
    global _warned_missing
    if _image_exists(docker, image):
        return True
    if not _warned_missing:
        log.warning(
            "sandbox image %r not found; build it with: %s", image, _BUILD_HINT
        )
        _warned_missing = True
    return False


def run_sandbox(solution_bytes: bytes, pytest_bytes: bytes, timeout_s: int = 30) -> Dict:
    docker = shutil.which("docker")
    if not docker:
        raise SandboxImageMissing(
            "docker binary not found in PATH. The sandbox must always run via "
            "Docker with --network=none to safely execute untrusted agent code. "
            "Start Docker, then build the sandbox image: " + _BUILD_HINT
        )

    if not _check_image_or_warn(docker, _DEFAULT_IMAGE):
        raise SandboxImageMissing(
            f"sandbox image {_DEFAULT_IMAGE!r} is missing. Build it first: {_BUILD_HINT}"
        )

    image = _DEFAULT_IMAGE
    # INVARIANT: network=none, always. Do not parameterize this away.
    network_flag = "--network=none"

    with tempfile.TemporaryDirectory() as td:
        workdir = Path(td)
        (workdir / "solution.py").write_bytes(solution_bytes)
        (workdir / "test_solution.py").write_bytes(pytest_bytes)

        shell_cmd = (
            "cp /work/*.py /tmp/ && cd /tmp && "
            "pytest -q --tb=short test_solution.py"
        )
        cmd = [
            docker, "run", "--rm", network_flag, "--read-only",
            "--tmpfs", "/tmp:exec",
            "-v", f"{workdir}:/work:ro",
            image,
            "sh", "-c", shell_cmd,
        ]
        try:
            proc = subprocess.run(cmd, timeout=timeout_s, capture_output=True, text=True)
        except subprocess.TimeoutExpired as e:
            return {
                "passed": False,
                "stdout": (e.stdout or "") if isinstance(e.stdout, str) else "",
                "stderr": f"sandbox timed out after {timeout_s}s",
                "failed_tests": [],
                "timed_out": True,
            }
        except FileNotFoundError as e:
            return {
                "passed": False,
                "stdout": "",
                "stderr": f"docker invocation failed: {e}",
                "failed_tests": [],
                "timed_out": True,
            }

        stdout = proc.stdout or ""
        stderr = proc.stderr or ""
        failed = _FAILED_RE.findall(stdout)
        passed = proc.returncode == 0 and not failed
        return {
            "passed": passed,
            "stdout": stdout,
            "stderr": stderr,
            "failed_tests": failed,
            "timed_out": False,
        }
