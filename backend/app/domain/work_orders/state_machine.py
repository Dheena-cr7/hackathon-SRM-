"""
CampusOps — Work Order State Machine
Enforces valid lifecycle transitions and rejects unauthorized or invalid state jumps.
"""

ALLOWED_TRANSITIONS = {
    "pending": {"assigned", "cancelled"},
    "assigned": {"in_progress", "pending", "cancelled"},
    "in_progress": {"awaiting_parts", "pending_verification", "cancelled"},
    "awaiting_parts": {"in_progress", "cancelled"},
    "pending_verification": {"completed", "in_progress"},
    "completed": set(),
    "cancelled": set()
}

class InvalidStateTransitionError(ValueError):
    """Raised when a requested state transition is not allowed by the state machine."""
    pass

def validate_transition(current_status: str, target_status: str) -> bool:
    allowed = ALLOWED_TRANSITIONS.get(current_status, set())
    if target_status not in allowed:
        raise InvalidStateTransitionError(
            f"Invalid transition from '{current_status}' to '{target_status}'. "
            f"Allowed next states: {sorted(list(allowed))}"
        )
    return True
