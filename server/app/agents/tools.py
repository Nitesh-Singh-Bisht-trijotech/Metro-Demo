"""Compatibility module re-exporting app.agent.tools."""

from app.agent.tools import (  # noqa: F401
    search_company_knowledge,
    transfer_to_human,
    web_search,
)

__all__ = ["search_company_knowledge", "transfer_to_human", "web_search"]

