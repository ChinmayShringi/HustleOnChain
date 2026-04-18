"""OpenAI-compatible chat completions client exposing Anthropic Messages-like API.

Provides a minimal adapter so existing code paths that call
`client.messages.create(system=..., messages=..., max_tokens=..., model=...)`
and read `response.content[0].text` continue to work when targeting an
OpenAI-compatible endpoint (e.g. LMStudio).
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
    def __init__(self, client: "OpenAICompatClient") -> None:
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
        url = f"{self._client.base_url.rstrip('/')}/chat/completions"
        chat_messages: list[dict[str, Any]] = [{"role": "system", "content": system}]
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if isinstance(content, list):
                text_parts = []
                for block in content:
                    if isinstance(block, dict):
                        t = block.get("text") or block.get("content") or ""
                        text_parts.append(t)
                    else:
                        text_parts.append(str(block))
                content = "".join(text_parts)
            chat_messages.append({"role": role, "content": content})
        payload = {
            "model": model,
            "messages": chat_messages,
            "max_tokens": max_tokens,
            "temperature": 0.2,
        }
        headers = {
            "Authorization": f"Bearer {self._client.api_key}",
            "Content-Type": "application/json",
        }
        with httpx.Client(timeout=self._client.timeout) as c:
            resp = c.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
        choices = data.get("choices") or []
        if not choices:
            return _Response(content=[_TextBlock(text="")])
        first = choices[0]
        msg = first.get("message") or {}
        text = msg.get("content") or ""
        if isinstance(text, list):
            # some providers send array-of-parts
            parts = []
            for part in text:
                if isinstance(part, dict):
                    parts.append(part.get("text", ""))
                else:
                    parts.append(str(part))
            text = "".join(parts)
        return _Response(content=[_TextBlock(text=str(text))])


class OpenAICompatClient:
    def __init__(self, base_url: str, api_key: str = "lm-studio", timeout: float = 120.0) -> None:
        self.base_url = base_url
        self.api_key = api_key
        self.timeout = timeout
        self.messages = _Messages(self)
