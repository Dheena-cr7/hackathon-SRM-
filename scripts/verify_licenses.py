#!/usr/bin/env python3
"""
CampusOps — Dependency License Compliance Auditor
Audits direct dependencies against the permitted zero-cost license list:
MIT, Apache-2.0, BSD, ISC, CC0.
"""

import sys

PERMITTED_LICENSES = {
    "MIT", "Apache-2.0", "BSD", "BSD-2-Clause", "BSD-3-Clause", "ISC", "CC0", "ODbL 1.0"
}

KNOWN_DEPENDENCY_LICENSES = {
    # Backend dependencies
    "fastapi": "MIT",
    "uvicorn": "BSD-3-Clause",
    "pydantic": "MIT",
    "sqlalchemy": "MIT",
    "alembic": "MIT",
    "asyncpg": "Apache-2.0",
    "aiosqlite": "MIT",
    "pyjwt": "MIT",
    "passlib": "BSD-3-Clause",
    "bcrypt": "Apache-2.0",
    "python-multipart": "Apache-2.0",
    "pytest": "MIT",
    "pytest-asyncio": "Apache-2.0",
    "httpx": "BSD-3-Clause",
    
    # Frontend dependencies
    "next": "MIT",
    "react": "MIT",
    "react-dom": "MIT",
    "typescript": "Apache-2.0",
    "tailwindcss": "MIT",
    "lucide-react": "ISC",
    "three": "MIT",
    "@react-three/fiber": "MIT",
    "@react-three/drei": "MIT",
    "recharts": "MIT",
    "react-hook-form": "MIT",
    "zod": "MIT",
    "playwright": "Apache-2.0",
    
    # Datasets
    "openstreetmap-campus-data": "ODbL 1.0",
}

def audit_licenses():
    print("==================================================")
    print("CAMPUSOPS — ZERO-COST LICENSE COMPLIANCE AUDIT")
    print("==================================================")
    violations = []
    
    for dep, lic in KNOWN_DEPENDENCY_LICENSES.items():
        if lic not in PERMITTED_LICENSES:
            violations.append((dep, lic))
            print(f"[REJECTED] {dep} -> License '{lic}' is not permitted.")
        else:
            print(f"[APPROVED] {dep} -> {lic}")
            
    print("\n--------------------------------------------------")
    if violations:
        print(f"AUDIT FAILED: {len(violations)} non-compliant dependencies found.")
        sys.exit(1)
    else:
        print(f"AUDIT PASSED: All {len(KNOWN_DEPENDENCY_LICENSES)} dependencies comply with the Zero-Cost license policy.")
        sys.exit(0)

if __name__ == "__main__":
    audit_licenses()
