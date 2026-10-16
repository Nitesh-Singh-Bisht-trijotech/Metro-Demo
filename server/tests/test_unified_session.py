"""
Tests for unified in-memory session context between voice and text using Google ADK.
"""

import pytest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from google.genai import types

import app.main as main
from app.persistence.sessions import (
    get_session_service,
    reset_session_service,
    resolve_session_id,
    reset_active_session,
    set_active_session_id,
)
from app.agent.agent import create_agent
from app.config import GEMINI_TEXT_MODEL


def setup_function():
    reset_session_service()


@pytest.mark.asyncio
async def test_text_agent_has_web_search_tool():
    """Verify text agent created for GEMINI_TEXT_MODEL contains web_search and search_dmrc_knowledge."""
    agent = create_agent(model=GEMINI_TEXT_MODEL)
    tool_names = [getattr(t, "__name__", str(t)) for t in agent.tools]
    assert "web_search" in tool_names
    assert "search_dmrc_knowledge" in tool_names


@pytest.mark.asyncio
async def test_session_sharing_between_text_and_voice():
    """Verify that text and voice endpoints share the exact same session_id in memory."""
    reset_session_service()

    # 1. First interaction: text chat sends session_id
    client_session_id = "user-tab-session-123"
    resolved_1 = resolve_session_id(client_session_id)
    assert resolved_1 == client_session_id

    # 2. Voice WebSocket connects with no session_id (frontend default)
    resolved_voice = resolve_session_id(None)
    assert resolved_voice == client_session_id  # Automatically matched to active text session!

    # 3. Create session in shared in-memory service
    service = get_session_service()
    session = await service.create_session(
        app_name=main.APP_NAME,
        user_id=main.TEXT_API_USER_ID,
        session_id=client_session_id,
    )
    assert session.id == client_session_id

    # 4. Append an event (simulating voice turn)
    voice_event = types.Content(
        role="user",
        parts=[types.Part.from_text(text="I spoke this during voice call.")],
    )
    from google.adk.events.event import Event
    await service.append_event(session, Event(content=voice_event))

    # 5. Fetch session again (as text endpoint would)
    fetched = await service.get_session(
        app_name=main.APP_NAME,
        user_id=main.TEXT_API_USER_ID,
        session_id=client_session_id,
    )
    assert fetched is not None
    assert len(fetched.events) == 1
    assert fetched.events[0].content.parts[0].text == "I spoke this during voice call."

    # 6. Reset session
    await main.reset_chat_session(main.ResetSessionRequest(session_id=client_session_id))
    fetched_after_reset = await service.get_session(
        app_name=main.APP_NAME,
        user_id=main.TEXT_API_USER_ID,
        session_id=client_session_id,
    )
    assert fetched_after_reset is None

