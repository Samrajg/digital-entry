from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from jose import JWTError, jwt
from app.core.security import SECRET_KEY, ALGORITHM
from app.services.notification_service import notification_manager

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    # Authenticate the WebSocket connection using the token query param
    if not token:
        await websocket.close(code=1008, reason="Missing token")
        return
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008, reason="Invalid token payload")
            return
    except JWTError:
        await websocket.close(code=1008, reason="Invalid or expired token")
        return

    await notification_manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive, waiting for client messages or disconnects
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        notification_manager.disconnect(websocket)
