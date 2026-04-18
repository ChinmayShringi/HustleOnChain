"""LLM-driven pytest generation with validation and retry."""

from __future__ import annotations

import ast
import re
from typing import Tuple

SYSTEM_PROMPT = (
    "You write deterministic pytest files for Python function specifications. "
    "Output only the pytest file contents, no markdown, no commentary. "
    "Include at least 6 test cases covering basic, edge, and error paths."
)

_FENCE_RE = re.compile(r"^```(?:python)?\s*\n(.*?)\n```\s*$", re.DOTALL)


def _strip_fences(text: str) -> str:
    t = text.strip()
    m = _FENCE_RE.match(t)
    if m:
        return m.group(1).strip()
    if t.startswith("```") and t.endswith("```"):
        inner = t.strip("`").strip()
        if inner.startswith("python\n"):
            inner = inner[len("python\n") :]
        return inner.strip()
    return t


def _extract_text(response) -> str:
    # Anthropic Messages API returns a list of content blocks.
    content = getattr(response, "content", None)
    if content is None and isinstance(response, dict):
        content = response.get("content")
    if isinstance(content, list):
        parts = []
        for block in content:
            text = getattr(block, "text", None)
            if text is None and isinstance(block, dict):
                text = block.get("text")
            if text:
                parts.append(text)
        return "".join(parts)
    if isinstance(content, str):
        return content
    return str(response)


def _validate(text: str) -> list[str]:
    # Raises ValueError with reason; returns list of test def names on success.
    try:
        tree = ast.parse(text)
    except SyntaxError as e:
        raise ValueError(f"pytest output did not parse: {e}") from e
    if "import pytest" not in text and "from pytest" not in text:
        raise ValueError("pytest output missing pytest import")
    names: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name.startswith("test_"):
            names.append(node.name)
    if len(names) < 3:
        raise ValueError(f"pytest output has only {len(names)} test_ defs; need >=3")
    return names


def generate_pytest(
    function_signature: str,
    acceptance_criteria: str,
    anthropic_client,
    model: str = "claude-opus-4-7",
    max_attempts: int = 3,
) -> Tuple[bytes, list[str]]:
    user_msg = (
        f"Function signature:\n{function_signature}\n\n"
        f"Acceptance criteria:\n{acceptance_criteria}"
    )
    last_err: Exception | None = None
    for _attempt in range(max_attempts):
        response = anthropic_client.messages.create(
            model=model,
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_msg}],
        )
        raw = _extract_text(response)
        text = _strip_fences(raw)
        try:
            names = _validate(text)
            return text.encode("utf-8"), names
        except ValueError as e:
            last_err = e
            continue
    raise ValueError(f"pytest generation failed after {max_attempts} attempts: {last_err}")
