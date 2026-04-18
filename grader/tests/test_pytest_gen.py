"""Unit tests for pytest_gen with mocked Anthropic client."""

from __future__ import annotations

import pytest

from grader.app.pytest_gen import generate_pytest


class _Block:
    def __init__(self, text: str):
        self.text = text


class _Response:
    def __init__(self, text: str):
        self.content = [_Block(text)]


class _MockMessages:
    def __init__(self, texts):
        self._texts = list(texts)
        self.calls = 0

    def create(self, **kwargs):
        self.calls += 1
        if not self._texts:
            raise RuntimeError("no more canned responses")
        return _Response(self._texts.pop(0))


class _MockClient:
    def __init__(self, texts):
        self.messages = _MockMessages(texts)


VALID_PYTEST = """import pytest

def fizzbuzz(n):
    return []

def test_empty():
    assert fizzbuzz(0) == []

def test_basic():
    assert isinstance(fizzbuzz(1), list)

def test_three():
    assert fizzbuzz(3) is not None

def test_five():
    assert fizzbuzz(5) is not None

def test_fifteen():
    assert fizzbuzz(15) is not None

def test_negative():
    assert fizzbuzz(-1) == []
"""

INVALID_NO_TESTS = """import pytest

def helper():
    return 1
"""

INVALID_SYNTAX = "import pytest\n\ndef test_bad(:\n    pass\n"


def test_valid_output_accepted():
    client = _MockClient([VALID_PYTEST])
    file_bytes, names = generate_pytest("def fizzbuzz(n): ...", "criteria", client)
    assert b"import pytest" in file_bytes
    assert len(names) >= 3
    assert "test_empty" in names
    assert client.messages.calls == 1


def test_fenced_output_stripped():
    fenced = f"```python\n{VALID_PYTEST}```"
    client = _MockClient([fenced])
    file_bytes, names = generate_pytest("sig", "crit", client)
    assert file_bytes.startswith(b"import pytest")
    assert len(names) >= 3


def test_retries_then_fails():
    client = _MockClient([INVALID_NO_TESTS, INVALID_SYNTAX, INVALID_NO_TESTS])
    with pytest.raises(ValueError):
        generate_pytest("sig", "crit", client)
    assert client.messages.calls == 3


def test_retry_then_succeed():
    client = _MockClient([INVALID_NO_TESTS, VALID_PYTEST])
    file_bytes, names = generate_pytest("sig", "crit", client)
    assert len(names) >= 3
    assert client.messages.calls == 2
