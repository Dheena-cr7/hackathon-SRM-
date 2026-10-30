import pytest
from backend.app.domain.intake.similarity_service import (
    tokenize,
    compute_tf,
    cosine_similarity,
    IncidentSimilarityEngine,
)


def test_tokenize_and_stopwords():
    tokens = tokenize("The electrical panel in room 204 is sparking with fire and smoke")
    assert "the" not in tokens
    assert "is" not in tokens
    assert "and" not in tokens
    assert "electrical" in tokens
    assert "panel" in tokens
    assert "204" in tokens
    assert "sparking" in tokens


def test_cosine_similarity_identical():
    tokens = ["electrical", "hazard", "room", "204"]
    vec = compute_tf(tokens)
    sim = cosine_similarity(vec, vec)
    assert pytest.approx(sim, 0.001) == 1.0


def test_cosine_similarity_completely_different():
    vec_a = compute_tf(["air", "conditioner", "auditorium", "chilled"])
    vec_b = compute_tf(["plumbing", "toilet", "pipe", "flooding"])
    sim = cosine_similarity(vec_a, vec_b)
    assert sim == 0.0


def test_incident_similarity_engine_duplicate_detection():
    existing = [
        {
            "id": "inc-01",
            "incident_number": "INC-2026-0001",
            "title": "Sparking panel in Tech Park room 204",
            "description": "Tech Park room 204 electrical panel sparking, smoke visible, exam scheduled at 2pm",
            "status": "in_progress",
            "room_number": "204",
        },
        {
            "id": "inc-02",
            "incident_number": "INC-2026-0002",
            "title": "Water leak in Tech Park 2nd floor",
            "description": "Plumbing leak in 2nd floor restroom corridor near stairs",
            "status": "reported",
            "room_number": None,
        },
    ]

    # Similar report
    new_report = "There are sparks coming from room 204 electrical breaker box in Tech Park!"
    duplicates = IncidentSimilarityEngine.find_duplicates(new_report, existing, threshold=0.3)

    assert len(duplicates) >= 1
    top_match = duplicates[0]
    assert top_match["incident_number"] == "INC-2026-0001"
    assert top_match["similarity_score"] > 0.35
    assert top_match["is_duplicate_candidate"] is True

