from fastapi import WebSocket
from typing import List, Set
import json
import asyncio
import logging

logger = logging.getLogger(__name__)


class NotificationManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Send a message to all connected WebSocket clients.
        
        Removes any clients that have disconnected. Safe to call from async context.
        """
        if not self.active_connections:
            return

        json_msg = json.dumps(message, default=str)
        disconnected: List[WebSocket] = []

        for connection in self.active_connections:
            try:
                await connection.send_text(json_msg)
            except Exception:
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)

    def broadcast_sync(self, message: dict):
        """
        BUG-24 FIX: Safe fire-and-forget broadcast from a synchronous (thread-pool) context.

        Problems with the old implementation:
          - loop.create_task() scheduled but never awaited — messages silently dropped on shutdown.
          - asyncio.run() in the except branch creates a brand-new event loop which raises
            RuntimeError if a loop already exists on this thread (common on some platforms).

        New approach:
          - Get the running loop (FastAPI always has one since it runs on uvicorn/asyncio).
          - Use run_coroutine_threadsafe() which properly submits the coroutine to the event
            loop from a synchronous thread and returns a Future you can optionally inspect.
          - If somehow there is no running loop (test / CLI contexts), log a warning and skip
            rather than crashing.
        """
        try:
            loop = asyncio.get_running_loop()
            # run_coroutine_threadsafe is the correct way to schedule a coroutine from a
            # sync thread into the event loop that belongs to another thread (uvicorn's).
            asyncio.run_coroutine_threadsafe(self.broadcast(message), loop)
        except RuntimeError:
            # No running event loop — this happens in unit tests or CLI contexts.
            # Log and skip rather than crashing.
            logger.warning(
                "broadcast_sync called with no running event loop — notification dropped. "
                "message type: %s", message.get("type", "unknown")
            )


# Global instance
notification_manager = NotificationManager()
