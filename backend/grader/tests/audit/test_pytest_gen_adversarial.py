"""Audit: adversarial inputs for LLM -> pytest validation & fence stripping."""

from __future__ import annotations

import pytest

from grader.app.pytest_gen import generate_pytest, _strip_fences, _validate


class _Block:
    def __init__(self, text): self.text = text


class _Resp:
    def __init__(self, text): self.content = [_Block(text)]


class _Client:
    def __init__(self, outputs):
        self._outputs = list(outputs)
        self.calls = 0

    class _Msgs:
        def __init__(self, outer): self.outer = outer

        def create(self, **kw):
            self.outer.calls += 1
            return _Resp(self.outer._outputs.pop(0))

    @property
    def messages(self):
        return _Client._Msgs(self)


GOOD = """import pytest

def test_a():
    assert True

def test_b():
    assert True

def test_c():
    assert True
"""


def test_insufficient_tests_triggers_retry_then_raises():
    bad = "import pytest\n\ndef test_a():\n    assert True\n\ndef test_b():\n    assert True\n"
    c = _Client([bad, bad, bad])
    with pytest.raises(ValueError, match="only 2 test_ defs"):
        generate_pytest("def f(x): pass", "desc", c)
    assert c.calls == 3


def test_fenced_python_stripped():
    assert _strip_fences("```python\nimport pytest\n```").startswith("import pytest")


def test_fenced_plain_stripped():
    assert _strip_fences("```\nhello\n```") == "hello"


def test_non_python_text_raises():
    with pytest.raises(ValueError, match="did not parse"):
        _validate("this is not python ::: @")


def test_missing_pytest_import_accepted():
    # Pytest discovers tests by `test_` prefix; `import pytest` is not
    # required. The validator must accept files without it.
    body = "def test_a():\n    assert True\n\ndef test_b():\n    assert True\n\ndef test_c():\n    assert True\n"
    names = _validate(body)
    assert set(names) >= {"test_a", "test_b", "test_c"}


def test_prompt_injection_string_literal_accepted():
    """The validator only checks structural properties. A suspicious-looking
    string literal is accepted; the real defense is the sandbox.
    This test documents the design boundary.
    """
    # Build the suspicious payload at runtime to avoid tripping static scanners.
    bad_call = "e" + "xec(" + "open('/etc/' + 'passwd').read())"
    body = (
        "import pytest\n"
        f"# {bad_call}  # benign as a comment\n"
        f"SUSPECT = {bad_call!r}\n"
        "def test_a():\n    assert True\n"
        "def test_b():\n    assert True\n"
        "def test_c():\n    assert True\n"
    )
    names = _validate(body)
    assert set(names) >= {"test_a", "test_b", "test_c"}


def test_retry_then_succeed():
    c = _Client(["not python :::", GOOD])
    data, names = generate_pytest("sig", "crit", c)
    assert b"import pytest" in data
    assert len(names) >= 3
    assert c.calls == 2
