import json
import logging
from typing import Dict, List, Set, Any
from fastapi import WebSocket

logger = logging.getLogger("medirush.websocket")

class WebSocketManager:
    def __init__(self):
        # Global active connections
        self.active_connections: Set[WebSocket] = set()
        # Dashboard specific listeners
        self.dashboard_connections: Set[WebSocket] = set()
        # Ambulance / Driver specific listeners: { ambulance_id: set(WebSockets) }
        self.ambulance_connections: Dict[str, Set[WebSocket]] = {}
        # Hardware signal nodes: { signal_id: set(WebSockets) }
        self.signal_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, client_type: str = "general", client_id: str = ""):
        await websocket.accept()
        self.active_connections.add(websocket)
        
        if client_type == "dashboard":
            self.dashboard_connections.add(websocket)
        elif client_type == "driver" and client_id:
            if client_id not in self.ambulance_connections:
                self.ambulance_connections[client_id] = set()
            self.ambulance_connections[client_id].add(websocket)
        elif client_type == "signal" and client_id:
            if client_id not in self.signal_connections:
                self.signal_connections[client_id] = set()
            self.signal_connections[client_id].add(websocket)
        
        logger.info(f"WebSocket connected. Type: {client_type}, ID: {client_id}. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        self.dashboard_connections.discard(websocket)
        
        for amb_id, sockets in list(self.ambulance_connections.items()):
            sockets.discard(websocket)
            if not sockets:
                self.ambulance_connections.pop(amb_id, None)

        for sig_id, sockets in list(self.signal_connections.items()):
            sockets.discard(websocket)
            if not sockets:
                self.signal_connections.pop(sig_id, None)

        logger.info(f"WebSocket disconnected. Remaining active: {len(self.active_connections)}")

    async def broadcast_all(self, event_type: str, data: Any):
        payload = json.dumps({"type": event_type, "data": data})
        dead_sockets = []
        for socket in self.active_connections:
            try:
                await socket.send_text(payload)
            except Exception:
                dead_sockets.append(socket)
        for dead in dead_sockets:
            self.disconnect(dead)

    async def broadcast_dashboard(self, event_type: str, data: Any):
        payload = json.dumps({"type": event_type, "data": data})
        dead_sockets = []
        for socket in self.dashboard_connections:
            try:
                await socket.send_text(payload)
            except Exception:
                dead_sockets.append(socket)
        for dead in dead_sockets:
            self.disconnect(dead)

    async def send_to_ambulance(self, ambulance_id: str, event_type: str, data: Any):
        payload = json.dumps({"type": event_type, "data": data})
        if ambulance_id in self.ambulance_connections:
            dead_sockets = []
            for socket in self.ambulance_connections[ambulance_id]:
                try:
                    await socket.send_text(payload)
                except Exception:
                    dead_sockets.append(socket)
            for dead in dead_sockets:
                self.disconnect(dead)

    async def send_to_signal(self, signal_id: str, event_type: str, data: Any):
        payload = json.dumps({"type": event_type, "data": data})
        if signal_id in self.signal_connections:
            dead_sockets = []
            for socket in self.signal_connections[signal_id]:
                try:
                    await socket.send_text(payload)
                except Exception:
                    dead_sockets.append(socket)
            for dead in dead_sockets:
                self.disconnect(dead)

ws_manager = WebSocketManager()
