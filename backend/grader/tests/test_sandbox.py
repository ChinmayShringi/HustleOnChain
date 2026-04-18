"""Sandbox integration tests; skipped if docker unavailable."""

from __future__ import annotations

import shutil

import pytest

from grader.app.sandbox import run_sandbox

pytestmark = pytest.mark.skipif(shutil.which("docker") is None, reason="docker not installed")

GOOD_SOLUTION = b"""
def fizzbuzz(n):
    out = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            out.append("FizzBuzz")
        elif i % 3 == 0:
            out.append("Fizz")
        elif i % 5 == 0:
            out.append("Buzz")
        else:
            out.append(str(i))
    return out
"""

BAD_SOLUTION = b"""
def fizzbuzz(n):
    return ["wrong"] * n
"""

PYTEST_FILE = b"""
from solution import fizzbuzz

def test_basic_three():
    assert fizzbuzz(3) == ["1", "2", "Fizz"]

def test_basic_five():
    assert fizzbuzz(5) == ["1", "2", "Fizz", "4", "Buzz"]

def test_fizzbuzz_fifteen():
    assert fizzbuzz(15)[-1] == "FizzBuzz"

def test_zero():
    assert fizzbuzz(0) == []
"""


def test_sandbox_passes_good():
    result = run_sandbox(GOOD_SOLUTION, PYTEST_FILE, timeout_s=90)
    assert result["passed"] is True, result
    assert result["failed_tests"] == []


def test_sandbox_fails_bad():
    result = run_sandbox(BAD_SOLUTION, PYTEST_FILE, timeout_s=90)
    assert result["passed"] is False
    assert len(result["failed_tests"]) >= 1
