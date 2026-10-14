"""
Session persistence module.

Uses Google ADK's DatabaseSessionService when available, with an automatic
circuit-breaker fallback to InMemorySessionService if the database host is unreachable
(e.g., DNS resolution failure or network timeout).
"""

import asyncio
import logging
from typing import Any, Optional

from google.adk.events.event import Event
from google.adk.sessions.base_session_service import (
    BaseSessionService,
    GetSessionConfig,
    ListSessionsResponse,
)
from google.adk.sessions.database_session_service import DatabaseSessionService
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.adk.sessions.session import Session

from app.config import get_async_database_url

logger = logging.getLogger(__name__)

_session_service = None


class ResilientSessionService(BaseSessionService):
    """BaseSessionService that delegates to DatabaseSessionService and falls back to InMemorySessionService on error."""

    def __init__(self, db_url: str | None = None):
        super().__init__()
        self._in_memory = InMemorySessionService()
        self._db_service: Optional[DatabaseSessionService] = None
        self._db_failed = False

        if db_url:
            try:
                self._db_service = DatabaseSessionService(db_url=db_url)
            except Exception as e:
                logger.warning("Failed to initialize DatabaseSessionService: %s. Using InMemorySessionService.", e)
                self._db_failed = True

    def _mark_db_failed(self, error: Exception):
        if not self._db_failed:
            self._db_failed = True
            self._db_service = None
            logger.warning("Database session service failed (%s). Switched to fast InMemorySessionService.", error)

    async def create_session(
        self,
        *,
        app_name: str,
        user_id: str,
        state: Optional[dict[str, Any]] = None,
        session_id: Optional[str] = None,
    ) -> Session:
        if self._db_service is not None and not self._db_failed:
            try:
                # 2.0s timeout prevents DNS hang on Windows
                return await asyncio.wait_for(
                    self._db_service.create_session(
                        app_name=app_name, user_id=user_id, state=state, session_id=session_id
                    ),
                    timeout=2.0,
                )
            except Exception as e:
                self._mark_db_failed(e)
        return await self._in_memory.create_session(
            app_name=app_name, user_id=user_id, state=state, session_id=session_id
        )

    async def get_session(
        self,
        *,
        app_name: str,
        user_id: str,
        session_id: str,
        config: Optional[GetSessionConfig] = None,
    ) -> Optional[Session]:
        if self._db_service is not None and not self._db_failed:
            try:
                return await asyncio.wait_for(
                    self._db_service.get_session(
                        app_name=app_name, user_id=user_id, session_id=session_id, config=config
                    ),
                    timeout=2.0,
                )
            except Exception as e:
                self._mark_db_failed(e)
        return await self._in_memory.get_session(
            app_name=app_name, user_id=user_id, session_id=session_id, config=config
        )

    async def list_sessions(
        self,
        *,
        app_name: str,
        user_id: Optional[str] = None,
    ) -> ListSessionsResponse:
        if self._db_service is not None and not self._db_failed:
            try:
                return await asyncio.wait_for(
                    self._db_service.list_sessions(app_name=app_name, user_id=user_id),
                    timeout=2.0,
                )
            except Exception as e:
                self._mark_db_failed(e)
        return await self._in_memory.list_sessions(app_name=app_name, user_id=user_id)

    async def delete_session(
        self,
        *,
        app_name: str,
        user_id: str,
        session_id: str,
    ) -> None:
        if self._db_service is not None and not self._db_failed:
            try:
                return await asyncio.wait_for(
                    self._db_service.delete_session(
                        app_name=app_name, user_id=user_id, session_id=session_id
                    ),
                    timeout=2.0,
                )
            except Exception as e:
                self._mark_db_failed(e)
        return await self._in_memory.delete_session(
            app_name=app_name, user_id=user_id, session_id=session_id
        )

    async def append_event(self, session: Session, event: Event) -> Event:
        if self._db_service is not None and not self._db_failed:
            try:
                return await asyncio.wait_for(
                    self._db_service.append_event(session, event),
                    timeout=2.0,
                )
            except Exception as e:
                self._mark_db_failed(e)
        return await self._in_memory.append_event(session, event)


def get_session_service() -> BaseSessionService:
    """Get or create the resilient ADK SessionService."""
    global _session_service
    if _session_service is None:
        db_url = get_async_database_url()
        _session_service = ResilientSessionService(db_url=db_url)
    return _session_service


def reset_session_service() -> None:
    """Reset the cached session service."""
    global _session_service
    _session_service = None
