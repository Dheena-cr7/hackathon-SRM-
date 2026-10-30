"""
CampusOps — Incident Intake & Layer 1 NLP Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.schemas.incident import NLPAnalyzeRequest, NLPAnalyzeResponse, IncidentCreate, IncidentResponse
from backend.app.domain.intake.nlp_extractor import extract_incident_features
from backend.app.domain.intake.similarity_service import IncidentSimilarityEngine
from backend.app.domain.incidents.service import IncidentService
from backend.app.api.deps import get_current_user
from backend.app.models.user import User

router = APIRouter(prefix="/intake", tags=["Incident Intake & AI"])

@router.post("/analyze", response_model=NLPAnalyzeResponse)
async def analyze_intake_text(data: NLPAnalyzeRequest):
    """Analyze raw natural-language report text through Layer 1 deterministic extractor."""
    text_to_analyze = data.query_text
    if not text_to_analyze:
        raise HTTPException(status_code=400, detail="Text or raw_text field is required for incident intake analysis")
    return extract_incident_features(text_to_analyze)

@router.post("/duplicates")
async def check_duplicate_incidents(
    data: NLPAnalyzeRequest,
    db: AsyncSession = Depends(get_db)
):
    """Check for duplicate or correlated open incidents using in-memory TF-IDF cosine similarity."""
    text_to_check = data.query_text
    incidents = await IncidentService.list_incidents(db)
    existing_list = [
        {
            "id": inc.id,
            "incident_number": inc.incident_number,
            "title": inc.title,
            "description": inc.description,
            "status": inc.status.value if hasattr(inc.status, "value") else str(inc.status),
            "room_number": inc.room_id,
        }
        for inc in incidents
    ]
    duplicates = IncidentSimilarityEngine.find_duplicates(text_to_check, existing_list)
    return {"duplicate_candidates": duplicates, "count": len(duplicates)}

@router.post("/submit", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def submit_incident(
    data: IncidentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit an incident ticket created via form, chat, or confirmed extraction."""
    incident = await IncidentService.create_incident(db, current_user.id, data)
    return IncidentResponse.model_validate(incident)

@router.post("/simulated-email", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def intake_simulated_email(
    email_payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Ingest simulated campus email, extract entities via Layer 1, and persist ticket."""
    subject = email_payload.get("subject", "Facility Report")
    body = email_payload.get("body", "")
    full_text = f"{subject}. {body}"

    extraction = extract_incident_features(full_text)
    building_id = extraction.building_id or "BLD-TECH-01"

    data = IncidentCreate(
        title=subject[:100],
        description=body or subject,
        category=extraction.category,
        priority=extraction.urgency,
        building_id=building_id,
        room_id=extraction.room_id,
        asset_id=extraction.asset_id,
        raw_text=full_text,
        extraction_metadata=extraction.model_dump()
    )
    incident = await IncidentService.create_incident(db, current_user.id, data)
    return IncidentResponse.model_validate(incident)

