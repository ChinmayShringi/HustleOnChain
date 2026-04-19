"""Gemini native API adapter exposing Anthropic Messages-like interface.

Mirrors `llm_openai.OpenAICompatClient` so pytest_gen and skill code paths
that call `client.messages.create(system=..., messages=..., max_tokens=..., model=...)`
and read `response.content[0].text` work unchanged against Google Generative
Language API (which rejects AQ.* keys on its OpenAI-compatible endpoint).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, List

import httpx


@dataclass
class _TextBlock:
    text: str
    type: str = "text"


@dataclass
class _Response:
    content: List[_TextBlock]


class _Messages:
    def __init__(self, client: "GeminiClient") -> None:
        self._client = client

    def create(
        self,
        *,
        model: str,
        max_tokens: int,
        system: str,
        messages: list[dict[str, Any]],
        **_: Any,
    ) -> _Response:
        url = f"{self._client.base_url.rstrip('/')}/v1beta/models/{model}:generateContent"
        contents: list[dict[str, Any]] = []
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if isinstance(content, list):
                text_parts: list[str] = []
                for block in content:
                    if isinstance(block, dict):
                        text_parts.append(block.get("text") or block.get("content") or "")
                    else:
                        text_parts.append(str(block))
                content = "".join(text_parts)
            contents.append(
                {
                    "role": "model" if role == "assistant" else "user",
                    "parts": [{"text": content}],
                }
            )
        payload: dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": 0.2,
            },
        }
        if system:
            payload["systemInstruction"] = {"parts": [{"text": system}]}
        params = {"key": self._client.api_key}
        headers = {"Content-Type": "application/json"}
        with httpx.Client(timeout=self._client.timeout) as c:
            resp = c.post(url, params=params, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
        candidates = data.get("candidates") or []
        if not candidates:
            return _Response(content=[_TextBlock(text="")])
        parts = (candidates[0].get("content") or {}).get("parts") or []
        text = "".join(p.get("text", "") for p in parts if isinstance(p, dict))
        return _Response(content=[_TextBlock(text=text)])


class GeminiClient:
    def __init__(
        self,
        *,
        api_key: str,
        base_url: str = "https://generativelanguage.googleapis.com",
        timeout: float = 60.0,
    ) -> None:
        self.api_key = api_key
        self.base_url = base_url
        self.timeout = timeout
        self.messages = _Messages(self)
