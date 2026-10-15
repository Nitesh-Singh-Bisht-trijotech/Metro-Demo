"""
Agent tools module.

Defines the ADK function tools used by the voice sales agent:
- search_company_knowledge: RAG-based company knowledge retrieval
- transfer_to_human: Mock human transfer for POC
"""

import logging
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


def search_company_knowledge(query: str) -> str:
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
    logger.info("Tool called: search_company_knowledge(query='%s')", query[:100])

    try:
        results = _rag_search(query)
        formatted = format_results_for_agent(results)
        logger.info("RAG search returned %d results.", len(results))
        return formatted
    except Exception as e:
        logger.error("search_company_knowledge failed: %s", e)
        return "I was unable to search the company knowledge base at this moment. Please try again or I can connect you with a specialist."


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
