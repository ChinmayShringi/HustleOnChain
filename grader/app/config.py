"""Pydantic settings loaded lazily from env. Missing values do not crash on import."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-opus-4-7"
    EVALUATOR_PRIVATE_KEY: str = ""
    DEPLOYER_PRIVATE_KEY: str = ""
    BSC_RPC_URL: str = "https://data-seed-prebsc-1-s1.binance.org:8545/"
    ERC8183_ADDRESS: str = ""
    GRADER_EVALUATOR_ADDRESS: str = ""
    GRADER_PUBLIC_BASE_URL: str = "http://localhost:8000"
    USDT_ADDRESS: str = ""
    X402_PRICE_WEI: int = 10_000_000_000_000_000
    DATA_DIR: str = "./grader/data"

    @property
    def data_path(self) -> Path:
        p = Path(self.DATA_DIR)
        p.mkdir(parents=True, exist_ok=True)
        return p


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
