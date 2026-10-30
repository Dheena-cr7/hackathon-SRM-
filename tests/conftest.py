"""
CampusOps — Test Fixtures and Database Isolation
Ensures each test runs with a freshly initialized and seeded database.
"""

import pytest
import os
from backend.app.core.database import engine, Base
from scripts.seed_generator import seed_database

@pytest.fixture(autouse=True)
async def reset_database():
    """Reset database tables and seed baseline data before each test."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    await seed_database()
    yield
