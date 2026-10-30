import pytest
from backend.app.domain.intake.nlp_extractor import extract_incident_features

def test_nlp_extraction_projector_lecture():
    text = "The projector in Room B204 is not working, and we have a lecture in 20 minutes."
    result = extract_incident_features(text)
    
    assert result.category == "it_av"
    assert result.building_id == "BLD-TECH-01"
    assert result.room_number == "B204"
    assert result.room_id == "RM-TP-204"
    assert result.asset_id == "AST-PROJ-001"
    assert result.urgency in ("high", "critical")
    assert result.time_constraint is not None
    assert len(result.missing_fields) == 0
    assert result.clarification_question is None

def test_nlp_extraction_critical_sparking():
    text = "There is a sparking circuit breaker in Tech Park Room B204 before the exam"
    result = extract_incident_features(text)
    
    assert result.category == "electrical"
    assert result.building_id == "BLD-TECH-01"
    assert result.room_number == "B204"
    assert result.urgency == "critical"
    assert len(result.missing_fields) == 0

def test_nlp_extraction_missing_room_clarification():
    text = "The AC is leaking in Tech Park"
    result = extract_incident_features(text)
    
    assert result.category == "hvac"
    assert result.building_id == "BLD-TECH-01"
    assert "location.room" in result.missing_fields
    assert result.clarification_question is not None
    assert "room or floor" in result.clarification_question.lower()

def test_nlp_extraction_mech_lab():
    text = "Pipe burst in Mech Lab 102 with water leaking"
    result = extract_incident_features(text)
    
    assert result.category == "plumbing"
    assert result.building_id == "BLD-ENG-02"
    assert result.room_id == "RM-MECH-102"

