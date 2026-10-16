"""
Agent definition module.

Creates the Google ADK Agent with Gemini Live model, system instructions,
and registered tools.
"""

import logging
import os
import sys
from pathlib import Path

# Ensure project root is in sys.path when loaded directly by ADK CLI
_project_root = str(Path(__file__).resolve().parent.parent.parent)
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from google.adk import Agent

from app.agent.instructions import AGENT_INSTRUCTIONS
from app.agent.tools import search_dmrc_knowledge, transfer_to_human, web_search
from app.config import GEMINI_API_KEY, GEMINI_LIVE_MODEL

logger = logging.getLogger(__name__)


def create_agent(model: str | None = None, instruction: str | None = None) -> Agent:
    """
    Create and configure the ADK sales agent.

    Args:
        model: Optional model override. Defaults to the configured Live model
            used by the voice endpoint.
        instruction: Optional system instruction override. Defaults to AGENT_INSTRUCTIONS.
    
    Returns:
        A configured Google ADK Agent with the selected model and tools.
    """
    # Ensure API key is set in environment for ADK
    if GEMINI_API_KEY:
        os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY

    selected_model = model or GEMINI_LIVE_MODEL
    selected_instruction = instruction or AGENT_INSTRUCTIONS
    logger.info("Creating ADK Agent with model: %s", selected_model)

    agent = Agent(
        name="chetna_metro_agent",
        model=selected_model,
        instruction=selected_instruction,
        tools=[
            search_dmrc_knowledge,
            web_search,
        ],
        description=(
            "Chetna is the official AI assistant for Delhi Metro (DMRC). "
            "She helps commuters with route planning, fares, station facilities, "
            "timings, ticketing, and metro policies."
        ),
    )
    

    logger.info("ADK Agent created successfully.")
    return agent


# Module-level agent instance for ADK web UI / adk CLI discovery
root_agent = create_agent()
