"""
CampusOps — Layer 1 Deterministic NLP Intelligence Engine
Zero-cost, offline natural-language intake parser.
Extracts category, building, room, asset, urgency, and time constraints
using regex pattern matching and campus dictionary entity linking.
"""

import re
from typing import Dict, Any, List, Optional
from backend.app.schemas.incident import NLPAnalyzeResponse

# Category Pattern Rules
CATEGORY_PATTERNS = {
    "electrical": re.compile(r"\b(spark|shock|power|blackout|breaker|socket|switch|wire|voltage|lights out|tripped|electricity|short circuit)\b", re.IGNORECASE),
    "hvac": re.compile(r"\b(ac|a/c|air condition(ing)?|cooling|heating|ventilation|filter|leak|temperature|hot|freezing|chiller|thermostat)\b", re.IGNORECASE),
    "it_av": re.compile(r"\b(projector|hdmi|display|audio|mic|screen|speaker|wifi|wi-fi|router|lan|cable|network|monitor|internet)\b", re.IGNORECASE),
    "plumbing": re.compile(r"\b(leak|pipe|water|clog|drain|faucet|toilet|flush|overflow|sewage|sink)\b", re.IGNORECASE),
    "structural": re.compile(r"\b(door|lock|window|glass|crack|ceiling|tile|elevator|stairs|roof|wall)\b", re.IGNORECASE),
    "safety": re.compile(r"\b(fire|smoke|hazard|emergency|chemical|gas|spill|danger)\b", re.IGNORECASE),
}

# Campus Dictionary & Aliases
BUILDING_ALIASES = {
    "BLD-TECH-01": [r"\btech park\b", r"\btp\b", r"\bacademic block\b", r"\btech block\b"],
    "BLD-ENG-02": [r"\bmech(anical)? lab(s)?\b", r"\bcivil lab(s)?\b", r"\beng(ineering)? lab(s)?\b"],
    "BLD-LIB-01": [r"\blibrary\b", r"\bcentral library\b"],
    "BLD-AUD-01": [r"\bauditorium\b", r"\bganesan auditorium\b", r"\btp ganesan\b"],
    "BLD-ADM-01": [r"\badministration\b", r"\badm\b", r"\bhq\b", r"\bregistrar\b"],
    "BLD-RES-01": [r"\bhostel\b", r"\bblock a\b", r"\bresidence\b"],
}

BUILDING_NAMES = {
    "BLD-TECH-01": "Tech Park (Main Academic Block)",
    "BLD-ENG-02": "Mechanical & Civil Engineering Labs",
    "BLD-LIB-01": "Central University Library",
    "BLD-AUD-01": "Dr. T.P. Ganesan Auditorium",
    "BLD-ADM-01": "Administrative Headquarters",
    "BLD-RES-01": "Student Hostel Complex (Block A)",
}

ROOM_PATTERNS = [
    # Explicit room codes: "B204", "TP204", "Room 204", "Room B204", "Hall 101"
    (re.compile(r"\b(?:room|hall|lab|rm)?\s*([A-Za-z]?\s*\d{3})\b", re.IGNORECASE), lambda m: m.group(1).replace(" ", "").upper()),
    (re.compile(r"\b(main\s+hall)\b", re.IGNORECASE), lambda m: "Main Hall"),
]

ASSET_KEYWORDS = {
    "projector": ("AST-PROJ-001", "Epson 4K Laser Projector", "it_av"),
    "laser projector": ("AST-PROJ-001", "Epson 4K Laser Projector", "it_av"),
    "ac": ("AST-HVAC-002", "Daikin Split AC 2.0 Ton", "hvac"),
    "air conditioner": ("AST-HVAC-002", "Daikin Split AC 2.0 Ton", "hvac"),
    "breaker": ("AST-BRK-003", "Main Circuit Breaker Board", "electrical"),
    "circuit breaker": ("AST-BRK-003", "Main Circuit Breaker Board", "electrical"),
}

TIME_PATTERNS = [
    re.compile(r"\b(?:in|after)\s+(\d+)\s*(?:mins|minutes)\b", re.IGNORECASE),
    re.compile(r"\b(?:starts?\s+at|at)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b", re.IGNORECASE),
    re.compile(r"\b(?:before|prior to)\s+(?:the\s+)?(exam|lecture|class|presentation|session)\b", re.IGNORECASE),
]

def extract_incident_features(text: str) -> NLPAnalyzeResponse:
    """Analyze raw natural language text and extract operational features."""
    cleaned = text.strip()
    
    # 1. Category Detection
    detected_category = "general"
    for cat, pattern in CATEGORY_PATTERNS.items():
        if pattern.search(cleaned):
            detected_category = cat
            break

    # 2. Building Recognition
    matched_building_id = None
    for b_id, aliases in BUILDING_ALIASES.items():
        for alias_regex in aliases:
            if re.search(alias_regex, cleaned, re.IGNORECASE):
                matched_building_id = b_id
                break
        if matched_building_id:
            break

    # 3. Room Recognition
    matched_room_num = None
    matched_room_id = None
    for pattern, formatter in ROOM_PATTERNS:
        match = pattern.search(cleaned)
        if match:
            matched_room_num = formatter(match)
            break

    # Resolve room ID if building and room number match known campus rooms
    if matched_room_num:
        if matched_room_num in ("B204", "204") or "204" in matched_room_num:
            matched_room_id = "RM-TP-204"
            matched_room_num = "B204"
            if not matched_building_id:
                matched_building_id = "BLD-TECH-01"
        elif "101" in matched_room_num:
            matched_room_id = "RM-TP-101"
            matched_room_num = "101"
        elif "102" in matched_room_num:
            matched_room_id = "RM-MECH-102"
            matched_room_num = "102"
            if not matched_building_id:
                matched_building_id = "BLD-ENG-02"
        elif "MAIN" in matched_room_num.upper():
            matched_room_id = "RM-AUD-01"
            matched_room_num = "Main Hall"
            if not matched_building_id:
                matched_building_id = "BLD-AUD-01"

    # Default building to Tech Park if room is in Tech Park
    if matched_room_id and matched_room_id.startswith("RM-TP") and not matched_building_id:
        matched_building_id = "BLD-TECH-01"

    # 4. Asset Recognition
    matched_asset_id = None
    matched_asset_name = None
    for kw, (a_id, a_name, a_cat) in ASSET_KEYWORDS.items():
        if re.search(r"\b" + re.escape(kw) + r"\b", cleaned, re.IGNORECASE):
            matched_asset_id = a_id
            matched_asset_name = a_name
            if detected_category == "general":
                detected_category = a_cat
            break

    # 5. Time Constraints & Urgency
    time_constraint = None
    for pattern in TIME_PATTERNS:
        match = pattern.search(cleaned)
        if match:
            time_constraint = match.group(0).strip()
            break

    # Urgency Rules
    urgency = "medium"
    is_exam_or_urgent = bool(re.search(r"\b(exam|lecture|test|emergency)\b", cleaned, re.IGNORECASE))
    if re.search(r"\b(spark(ing)?|fire|smoke|shock|blackout|emergency|short\s*circuit)\b", cleaned, re.IGNORECASE):
        urgency = "critical"
    elif is_exam_or_urgent or (time_constraint and ("min" in time_constraint.lower() or "exam" in time_constraint.lower())):
        urgency = "high"
    elif re.search(r"\b(minor|slow|cosmetic|flicker)\b", cleaned, re.IGNORECASE):
        urgency = "low"

    # 6. Missing Fields Detection & Clarification
    missing_fields = []
    clarification_question = None

    if not matched_building_id and not matched_room_id:
        missing_fields.append("location.building")
        missing_fields.append("location.room")
        clarification_question = "Which building and room is this issue occurring in?"
    elif not matched_room_id:
        missing_fields.append("location.room")
        b_name = BUILDING_NAMES.get(matched_building_id, "the specified building")
        clarification_question = f"Could you please specify which room or floor in {b_name} this is located?"

    building_name = BUILDING_NAMES.get(matched_building_id) if matched_building_id else None

    return NLPAnalyzeResponse(
        category=detected_category,
        building_id=matched_building_id,
        building_name=building_name,
        room_id=matched_room_id,
        room_number=matched_room_num,
        asset_id=matched_asset_id,
        asset_name=matched_asset_name,
        urgency=urgency,
        time_constraint=time_constraint,
        missing_fields=missing_fields,
        clarification_question=clarification_question,
        confidence_score=0.95
    )
