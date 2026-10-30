# CAMPUSOPS — FREE & OFFLINE AI ARCHITECTURE SPECIFICATION

In compliance with the Zero-Cost and Offline mandates, CampusOps implements a layered AI architecture that functions autonomously without cloud APIs, paid tokens, or internet connectivity.

---

## 1. Architectural Philosophy
> **"AI understands. The backend validates. Deterministic workflows execute. Humans approve sensitive actions."**

```mermaid
flowchart TD
    RawInput["Raw Campus Report\n(Chat, Form, Simulated Email)"]
    
    subgraph Layer1 ["Layer 1: Deterministic Intelligence (Mandatory & Always Active)"]
        Tokenizer["Token Normalizer & Cleaner"]
        DictMatch["Campus Dictionary & Alias Matcher\n(Buildings, Rooms, Assets)"]
        RegexExtract["Pattern Matchers & Regex Parser\n(Urgency, Time Phrases, Categories)"]
        MissingCheck["Missing Field Detector &\nClarification Generator"]
    end
    
    subgraph Layer2 ["Layer 2: Local Sentence Embeddings (Optional Local Enhancement)"]
        LocalEmbed["Local CPU Embedding Engine\n(all-MiniLM-L6-v2 / In-Memory Cosine Similarity)"]
        Dedupe["Duplicate Candidate Scorer &\nCluster Detection"]
    end
    
    subgraph Layer3 ["Layer 3: Optional Local LLM (Off by Default)"]
        OllamaEngine["Local Model via Ollama / llama.cpp\n(e.g., Llama 3.2 1B / Qwen 2.5 1.5B)"]
        PydanticGuard["Pydantic Strict Schema Validator\n(Reject hallucinations)"]
    end
    
    subgraph OutputGate ["Deterministic Validation Gate"]
        BackendCheck["Backend Database Directory Check\n(Does Building/Room/Asset Exist?)"]
        StructuredIncident["Structured Incident Payload"]
    end
    
    RawInput --> Tokenizer
    Tokenizer --> DictMatch
    DictMatch --> RegexExtract
    RegexExtract --> MissingCheck
    MissingCheck --> BackendCheck
    
    RawInput -.->|If Enabled| LocalEmbed
    LocalEmbed -.-> Dedupe
    Dedupe -.-> BackendCheck
    
    RawInput -.->|If Local LLM Configured| OllamaEngine
    OllamaEngine -.-> PydanticGuard
    PydanticGuard -.->|Fail or Timeout| RegexExtract
    PydanticGuard -.->|Valid| BackendCheck
    
    BackendCheck --> StructuredIncident
```

---

## 2. Layer 1: Deterministic Intelligence (Mandatory)

### 2.1 Keyword & Regex Extractor
- Runs 100% locally with zero machine-learning dependencies.
- **Category Pattern Rules:**
  - *Electrical:* `(spark|shock|power|blackout|breaker|socket|switch|wire|voltage|lights out)`
  - *HVAC / Air Conditioning:* `(ac|a/c|cooling|heating|ventilation|filter|leak|temperature|hot|freezing)`
  - *IT & AV Equipment:* `(projector|hdmi|display|audio|mic|screen|speaker|wifi|router|lan|cable)`
  - *Plumbing:* `(leak|pipe|water|clog|drain|faucet|toilet|flush|overflow)`
  - *Structural / Safety:* `(door|lock|window|glass|crack|ceiling|tile|elevator|stairs)`

### 2.2 Campus Dictionary & Alias Matching
- Dynamically loads known entity codes and aliases from the `buildings`, `rooms`, and `assets` tables:
  - `"Tech Park"`, `"TP"`, `"TP Block"`, `"Academic Block"` -> `BLD-TECH-01`
  - `"B204"`, `"TP 204"`, `"Room 204"` -> `RM-TP-204`
  - `"Epson Projector"`, `"Projector"` -> `AST-PROJ-001`
- Prevents silent hallucination: if a location is not in the database, it flags it as unverified.

### 2.3 Time Parsing & Urgency Evaluation
- Parses explicit relative time constraints:
  - `"in 20 minutes"`, `"starts at 10 AM"`, `"before exam"`, `"lecture in 15 mins"`
- Assigns priority dynamically:
  - Immediate academic disruption (< 60 mins before class/exam) -> **High / Critical**
  - Safety hazard (fire, spark, flooding) -> **Critical**
  - Minor cosmetic / non-blocking defect -> **Low / Medium**

### 2.4 Clarification Generator
- When essential attributes are missing (e.g. user says *"The AC is broken and making noise"* without specifying which room):
  - Automatically identifies missing fields: `location.room`
  - Prompts: *"Could you specify which room or floor in the building this is occurring in?"*

---

## 3. Layer 2: Local Sentence Embeddings (Optional)
- **Model:** Open-source `all-MiniLM-L6-v2` (Apache-2.0).
- **Execution:** CPU inference via in-memory cosine similarity or `pgvector`.
- **Use Case:** Recommends potential duplicate tickets and correlated historical failures across nearby rooms.
- **Safety Gate:** Similarity recommendations **never** automatically merge tickets. Merging requires explicit human confirmation.

---

## 4. Layer 3: Optional Local LLM (Disabled by Default)
- **Engine:** Local Ollama daemon running on `localhost:11434`.
- **Schema Validation:** Raw LLM outputs are fed through a strict Pydantic model (`IncidentExtractionSchema`).
- **Resilient Fallback:** If the local LLM is unresponsive, times out (> 3 seconds), or outputs invalid JSON, the system transparently falls back to Layer 1 deterministic extraction without throwing user-facing errors.
- **Rule of Authority:** An LLM is never permitted to approve a purchase, override a double-booking constraint, or assign a technician.
