"""
CampusOps — Identity & Authentication Service
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.user import User
from backend.app.core.security import verify_password, create_access_token
from backend.app.schemas.auth import TokenResponse, UserResponse

class IdentityService:
    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[TokenResponse]:
        query = select(User).where(User.email == email.lower().strip())
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            return None
        
        if not verify_password(password, user.hashed_password):
            return None
        
        token = create_access_token(subject=user.id, role=user.role)
        return TokenResponse(
            access_token=token,
            user=UserResponse.model_validate(user)
        )

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        return await db.get(User, user_id)
