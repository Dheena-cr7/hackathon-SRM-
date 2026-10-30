"""
CampusOps — Explainable Technician Allocation Engine
Deterministic matching based on skill certifications, shift availability, and workload balancing.
"""

from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.app.models.user import User, StaffProfile, Skill
from backend.app.schemas.work_order import TechnicianCandidate

CATEGORY_TO_SKILL_CODE = {
    "electrical": "SKL-ELEC",
    "hvac": "SKL-HVAC",
    "plumbing": "SKL-PLUMB",
    "it_av": "SKL-ITAV",
}

class StaffAllocator:
    @staticmethod
    async def recommend_technicians(db: AsyncSession, category: str) -> List[TechnicianCandidate]:
        required_skill_code = CATEGORY_TO_SKILL_CODE.get(category.lower())
        
        # Load staff profiles with user details and skills
        query = (
            select(StaffProfile)
            .join(User, StaffProfile.user_id == User.id)
            .where(User.is_active == True)
            .options(selectinload(StaffProfile.user), selectinload(StaffProfile.skills))
        )
        result = await db.execute(query)
        profiles = result.scalars().all()

        candidates: List[TechnicianCandidate] = []
        for p in profiles:
            skill_codes = [s.code for s in p.skills]
            has_matching_skill = (required_skill_code in skill_codes) if required_skill_code else True
            
            # Base score calculation
            score = 100.0
            reasons = []

            if has_matching_skill:
                score += 50.0
                reasons.append(f"Possesses certification: {required_skill_code}")
            else:
                score -= 40.0
                reasons.append("Lacks exact specialty certification")

            if p.is_on_duty:
                score += 30.0
                reasons.append(f"On active shift ({p.shift_start} - {p.shift_end})")
            else:
                score -= 80.0
                reasons.append("Currently off-duty")

            # Workload impact: lower workload gives higher priority
            score -= (p.current_workload * 15.0)
            reasons.append(f"Active workload: {p.current_workload} order(s)")

            reason_str = " | ".join(reasons)
            candidates.append(TechnicianCandidate(
                user_id=p.user_id,
                full_name=p.user.full_name,
                email=p.user.email,
                title=p.title,
                current_workload=p.current_workload,
                matched_skills=skill_codes,
                is_on_duty=p.is_on_duty,
                shift=f"{p.shift_start}-{p.shift_end}",
                score=score,
                recommendation_reason=reason_str
            ))

        # Sort descending by score (highest scoring first)
        candidates.sort(key=lambda c: c.score, reverse=True)
        return candidates
