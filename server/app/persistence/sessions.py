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


_session_service: Optional[InMemorySessionService] = None
_active_session_id: Optional[str] = None
_session_aliases: dict[str, str] = {}


def get_session_service() -> BaseSessionService:
    """Get or create the shared in-memory ADK SessionService."""
    global _session_service
    if _session_service is None:
        _session_service = InMemorySessionService()
    return _session_service


def reset_session_service() -> None:
    """Reset the cached session service."""
    global _session_service, _active_session_id, _session_aliases
    _session_service = None
    _active_session_id = None
    _session_aliases.clear()


def set_active_session_id(session_id: str) -> None:
    """Set the currently active in-memory session ID."""
    global _active_session_id
    _active_session_id = session_id


def get_active_session_id() -> Optional[str]:
    """Get the currently active in-memory session ID."""
    return _active_session_id


def resolve_session_id(session_id: Optional[str] = None) -> str:
    """Resolve a session_id, linking it with the active session so voice & text share context."""
    import uuid

    global _active_session_id
    if not session_id or not session_id.strip():
        if not _active_session_id:
            _active_session_id = str(uuid.uuid4())
        return _active_session_id

    sid = session_id.strip()
    if sid in _session_aliases:
        return _session_aliases[sid]

    if _active_session_id and _active_session_id != sid:
        # Link incoming session_id as alias to the active session so voice and text share context
        _session_aliases[sid] = _active_session_id
        return _active_session_id

    _active_session_id = sid
    return sid


def reset_active_session(session_id: Optional[str] = None) -> None:
    """Reset the active session tracking."""
    global _active_session_id, _session_aliases
    if session_id:
        sid = session_id.strip()
        resolved = _session_aliases.get(sid, sid)
        _session_aliases.pop(sid, None)
        if _active_session_id in (resolved, sid):
            _active_session_id = None
    else:
        _active_session_id = None
        _session_aliases.clear()
