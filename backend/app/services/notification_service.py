from fastapi import WebSocket
from typing import List
import json
import asyncio

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
        # Convert dictionary to JSON string
        json_msg = json.dumps(message)
        # Handle disconnected clients gracefully
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json_msg)
            except Exception:
                disconnected.append(connection)
        
        for conn in disconnected:
            self.disconnect(conn)

    def broadcast_sync(self, message: dict):
        """
        Helper method to broadcast a message from a synchronous context.
        """
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.broadcast(message))
        except RuntimeError:
            # If no running loop, create one (rarely happens in FastAPI threadpool but safe fallback)
            asyncio.run(self.broadcast(message))

# Global instance
notification_manager = NotificationManager()
