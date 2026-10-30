"""
CampusOps — WebSocket Realtime Operational Event Stream
Broadcasts domain events to connected browser dashboards and 3D digital twin clients.
"""

import json
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.app.core.events import event_bus

router = APIRouter(tags=["Realtime Events"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        text_data = json.dumps(message)
        for connection in list(self.active_connections):
            try:
                await connection.send_text(text_data)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

# Hook event bus to WebSocket broadcaster
async def broadcast_event_handler(event_name: str, payload: dict):
    await manager.broadcast({"event": event_name, "payload": payload})

for event in [
    "IncidentCreated", "IncidentStatusChanged", "WorkOrderCreated",
    "TechnicianAssigned", "WorkOrderStateChanged", "BookingCreated",
    "BookingRelocated", "PartsReserved", "PurchaseRequestCreated"
]:
    event_bus.subscribe(event, lambda p, ev=event: broadcast_event_handler(ev, p))

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep-alive ping/pong
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
