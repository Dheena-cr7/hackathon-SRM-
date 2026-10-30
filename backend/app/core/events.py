"""
CampusOps — Asynchronous Domain Event Bus
In-memory event dispatcher supporting pub/sub across bounded contexts
and WebSocket client broadcasting.
"""

import asyncio
from typing import Any, Callable, Dict, List
import logging

logger = logging.getLogger("campusops.events")

class EventBus:
    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[Dict[str, Any]], Any]]] = {}

    def subscribe(self, event_name: str, handler: Callable[[Dict[str, Any]], Any]):
        if event_name not in self._subscribers:
            self._subscribers[event_name] = []
        self._subscribers[event_name].append(handler)

    async def publish(self, event_name: str, payload: Dict[str, Any]):
        handlers = self._subscribers.get(event_name, [])
        logger.info(f"Dispatching event '{event_name}' to {len(handlers)} subscriber(s)")
        for handler in handlers:
            try:
                res = handler(payload)
                if asyncio.iscoroutine(res):
                    asyncio.create_task(res)
            except Exception as e:
                logger.error(f"Error executing handler for event {event_name}: {e}")

event_bus = EventBus()
