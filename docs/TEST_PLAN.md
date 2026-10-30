# CAMPUSOPS — COMPREHENSIVE TEST PLAN

In compliance with the ingested [`tdd-workflow`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/tdd-workflow/SKILL.md) and [`pytest-skill`](file:///c:/Users/Dheena/Desktop/hackathon(SRM)/.agent/skills/pytest-skill/SKILL.md) skills, CampusOps applies a rigorous, automated testing pyramid.

---

## 1. Testing Pyramid & Scope

```
                ▲
               / \
              /   \
             / E2E \       End-to-End User Scenarios (Scenario A & B)
            /───────\
           / Integr. \     API Contracts, DB Transactions, RBAC Boundaries
          /───────────\
         /  Unit Tests \   NLP Extractor, Allocation Logic, State Machines
        /───────────────\
```

---

## 2. Test Execution Commands (Local & Zero-Cost)

### Backend Pytest Suite
```bash
# Run complete backend test suite
pytest -v

# Run unit tests only
pytest tests/unit/ -v

# Run concurrency and transaction safety tests
pytest tests/api/test_bookings_concurrency.py tests/api/test_inventory_concurrency.py -v

# Run full disruption scenario tests
pytest tests/scenarios/ -v
```

### Frontend Test Suite
```bash
# Run unit and component tests
cd frontend && npm test

# Run accessibility checks
cd frontend && npm run test:a11y
```

---

## 3. Dedicated Verification Areas

### 3.1 Concurrency & Race-Condition Testing
- **Room Booking Simulation:** Spawns 10 concurrent async tasks requesting reservation of the same room (`RM-TP-204`) at overlapping timestamps.
  - *Expected Outcome:* Exactly 1 task succeeds; 9 tasks fail with `HTTP 409 Conflict`.
- **Inventory Stock Reservation:** Spawns 10 concurrent requests reserving 3 units each on an item with only 10 units in stock.
  - *Expected Outcome:* 3 requests succeed (reserving 9 units); the remaining fail with `HTTP 400 Insufficient Stock`. Final stock remains non-negative.

### 3.2 Offline Sandbox Verification
- Runs test suites with network sockets blocked to ensure zero calls to external APIs, CDNs, or remote AI servers.
- Validates that Layer 1 NLP extraction performs identically without internet.

### 3.3 Anti-Self-Approval Verification
- Attempts to approve a purchase request using the authentication token of the creator.
- Verifies that `HTTP 403 Forbidden` (`SELF_APPROVAL_PROHIBITED`) is returned and the decision is rejected.
