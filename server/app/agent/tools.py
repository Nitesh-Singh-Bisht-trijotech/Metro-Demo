"""
Agent tools module.

Defines the ADK function tools used by the voice sales agent:
- search_company_knowledge: RAG-based company knowledge retrieval
- transfer_to_human: Mock human transfer for POC
"""

import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Ensure project root is in sys.path
_project_root = str(Path(__file__).resolve().parent.parent.parent)
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

try:
    from langsmith import traceable
except ImportError:
    def traceable(*args, **kwargs):
        def decorator(f):
            return f
        return decorator

from app.rag.search import format_results_for_agent, search_company_knowledge as _rag_search

logger = logging.getLogger(__name__)


def search_dmrc_knowledge(query: str) -> str:
    """Search the Delhi Metro (DMRC) knowledge base for information about metro lines, stations, interchanges, fares, timings, facilities, smart cards, tokens, lost & found, and helpline contacts.

    Use this tool whenever a commuter asks about Delhi Metro information such as:
    - Route between stations or interchange lines
    - Metro fares, smart card discounts, and token rules
    - Station facilities (lifts, escalators, parking, cloak rooms)
    - First and last train timings
    - Lost and found procedures or helpline contacts
    - Network expansion, Phase 4, or general DMRC policies

    Args:
        query: The question or transit topic to search for in the DMRC knowledge base.

    Returns:
        Relevant Delhi Metro information found in the knowledge base, or a message indicating no results were found.
    """
    logger.info("Tool called: search_dmrc_knowledge(query='%s')", query[:100])

    try:
        results = _rag_search(query)
        formatted = format_results_for_agent(results)
        logger.info("RAG search returned %d results.", len(results))
        return formatted
    except Exception as e:
        logger.error("search_company_knowledge failed: %s", e)
        return "I was unable to search the company knowledge base at this moment. Please try again or I can connect you with a specialist."


# Backward-compatible alias
search_company_knowledge = search_dmrc_knowledge


def transfer_to_human(reason: str, customer_requirement: str) -> str:
    """Transfer the customer to a human specialist.

    Use this tool when:
    - The customer wants to proceed with a service or purchase
    - The customer needs information you cannot find in the knowledge base
    - The customer explicitly asks to speak with a human
    - You need to escalate a complex request

    Args:
        reason: Why the transfer is being initiated (e.g., "Customer wants to proceed with SAP BTP implementation").
        customer_requirement: A summary of what the customer is looking for or needs.

    Returns:
        A confirmation message about the transfer request.
    """
    timestamp = datetime.now(timezone.utc).isoformat()

    transfer_record = {
        "reason": reason,
        "customer_requirement": customer_requirement,
        "timestamp": timestamp,
        "status": "transfer_requested",
    }

    logger.info("=" * 50)
    logger.info("TRANSFER TO HUMAN REQUESTED")
    logger.info("  Reason: %s", reason)
    logger.info("  Customer Requirement: %s", customer_requirement)
    logger.info("  Timestamp: %s", timestamp)
    logger.info("=" * 50)

    return (
        f"Transfer request submitted successfully. "
        f"A specialist will be connected shortly to help with: {customer_requirement}. "
        f"Transfer reference timestamp: {timestamp}"
    )


@traceable(name="web_search", run_type="tool")
def web_search(query: str) -> str:
    """Search the web for real-time Delhi Metro fares, stops, distance, travel duration, timings, and transit details.

    Use this tool whenever a commuter asks about:
    - Delhi Metro ticket fares, prices, token rates, and smart card discounts
    - Station stops, routes, and interchange lines between two stations
    - Distance (in km) and travel duration / journey time between stations
    - First train and last train departure timings
    - Real-time transit updates, line operational status, or platform information

    Args:
        query: The search query about Delhi Metro fares, stops, distance, timings, or routes.

    Returns:
        Structured search results with fares, stops, distance, and time details.
    """
    clean_query = (query or "").strip()
    if not clean_query:
        return "Please provide a valid query to search."

    logger.info("Tool called: web_search(query='%s')", clean_query[:100])

    from app.config import TAVILY_API_KEY
    api_key = TAVILY_API_KEY or os.getenv("TAVILY_API_KEY")

    if not api_key:
        logger.warning("web_search: TAVILY_API_KEY is not configured.")
        return "Web search is currently unavailable because the Tavily API key is not configured."

    # Optimize query for Delhi Metro transit context if missing
    search_query = clean_query
    q_lower = clean_query.lower()
    if not any(k in q_lower for k in ["delhi", "metro", "dmrc"]):
        search_query = f"Delhi Metro {clean_query}"

    try:
        from tavily import TavilyClient

        client = TavilyClient(api_key=api_key)
        response = client.search(
            query=search_query,
            max_results=5,
            include_answer=False,
            search_depth="basic",
        )

        parts: list[str] = []
        answer = response.get("answer")
        if answer:
            parts.append(f"Summary Answer:\n{answer.strip()}")

        results = response.get("results", [])
        if results:
            parts.append("Detailed Sources:")
            for idx, r in enumerate(results[:4], 1):
                title = r.get("title", "").strip()
                url = r.get("url", "").strip()
                content = r.get("content", "").strip()
                entry = f"{idx}. {title}"
                if url:
                    entry += f"\n   Source: {url}"
                if content:
                    entry += f"\n   Details: {content}"
                parts.append(entry)

        if not parts:
            return f"No search results found for '{clean_query}'."

        formatted_result = "\n\n".join(parts)
        logger.info("web_search returned %d characters of results.", len(formatted_result))
        return formatted_result

    except Exception as e:
        logger.error("web_search failed: %s", e, exc_info=True)
        return f"Unable to search the web at this moment. Error: {e}"

