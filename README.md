# Sentinel Memory

> *"Your security team shouldn't have to rediscover the same attack twice."*

Built for **HackWithHyderabad 3.0** — Powered by **Vectorize Hindsight**.

---

## Executive Summary

Traditional Security Operations Centers (SOCs) suffer from severe alert fatigue and institutional amnesia. Every alert is investigated from scratch:
- Analysts re-triage the same authorized backup automation month after month.
- Threat intelligence from last week's targeted spear-phishing attack isn't immediately contextualized when a similar encoded PowerShell script triggers on a different finance workstation.
- Generic LLM chatbots lack persistent, verifiable memory of organizational playbooks and analyst feedback.

**Sentinel Memory** transforms the SOC with **Vectorize Hindsight** as its persistent long-term memory engine. It connects incoming alert telemetry directly to historical incidents, approved IT exceptions, and previous analyst feedback—delivering context-aware investigations that evolve over time.

---

## How Hindsight Memory is Used

Hindsight is **central** to Sentinel Memory's architecture, not merely a key-value store or vector database:

```
                    ┌────────────────────────────────────────────────────────┐
                    │               VECTORIZE HINDSIGHT ENGINE               │
                    │                   Bank: sentinel-memory                │
                    └────────────────────────────────────────────────────────┘
                                ▲                         │
                         retain │                         │ recall / reflect
                                │                         ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Security Alert  │───▶│ Hindsight Recall │───▶│ Context-Aware AI │───▶│ Analyst Feedback │
│ (Process / Tele) │    │ (Semantic Search)│    │  (Groq/Llama-3.3)│    │  (Verdict / FP)  │
└──────────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
                                                                                  │
                                                                                  ▼
                                                                        client.retain(...)
                                                                        [Loop Completed]
```

### 1. `retain` (Experience & Feedback Memorization)
- **Incident Precedents:** Synthetic MITRE ATT&CK security incidents are retained into Hindsight (`bank_id: sentinel-memory`) with rich natural language narratives, technical tags (`['word_powershell', 'true_positive', ...]`), and structured metadata.
- **Analyst Feedback Loop:** When a tier-2 analyst reviews an alert and submits a verdict (e.g. *"This was an authorized quarterly backup archiver doc_archiver.ps1 approved by IT Systems Engineering"*), Sentinel calls `hindsight.retain()` to commit this experience to long-term memory.

### 2. `recall` (Contextual Incident Retrieval)
- When a new alert arrives, Sentinel normalizes the process hierarchy (`winword.exe` spawning `powershell.exe`), flags, and network destinations, then dynamically constructs a high-signal semantic query.
- It calls `hindsight.recall(...)` to retrieve relevant precedent cases, similarity scores, and prior SOC resolution outcomes.

### 3. `reflect` (Biomimetic Mental Model Synthesis)
- Sentinel leverages `hindsight.reflect(...)` to synthesize deep organizational mental models across the memory bank (e.g., extracting recurring IT automation policies and false positive exception guidelines).

---

## 60-Second Hackathon Judge Demo

Sentinel includes a dedicated **Judge Demo Mode** (`/demo` tab) that makes the learning progression immediately visible in 4 interactive steps:

| Step | Action | Outcome |
|---|---|---|
| **1. The Attack Precedent** | Investigate `ALT-1042` (Word → Encoded PowerShell) | Sentinel matches MITRE ATT&CK T1059 / T1204, recalls prior incidents `INC-0037` and `INC-0081`, and recommends quarantine. |
| **2. The False Positive Dilemma** | Investigate `ALT-1088` (Scheduled Backup Archiver) | Standard rules would quarantine mission-critical backup servers. Sentinel flags the ambiguity and requests human confirmation. |
| **3. The Learning Action** | Analyst submits Feedback on `ALT-1088` | Analyst tags it as **False Positive** (*"Approved corporate backup tool doc_archiver.ps1"*). Sentinel calls `hindsight.retain()` live. |
| **4. Contextual Evolution** | Investigate `ALT-1140` (Finance Template Refresh) | Sentinel **recalls the retained feedback from Step 3** in real time! It recognizes the authorized automation pattern, safely downgrading risk to LOW and preventing business disruption. |

---

## Before & After Memory Comparison

| Dimension | Generic AI / Without Memory | Sentinel Memory (With Hindsight) |
|---|---|---|
| **Risk Evaluation** | HIGH (65% confidence, rigid heuristic) | LOW (94% confidence, precedent-verified) |
| **Context** | Zero knowledge of internal enterprise scripts | Recalls `INC-0052` and Lead Analyst exception notes |
| **Action** | Quarantines critical server, causes downtime | Validates against change calendar, zero downtime |
| **Fatigue** | SOC analyst investigates same alert 50 times | Agent remembers exception permanently |

---

## Architecture

```
sentinel-memory/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # FastAPI routes: health, alerts, incidents, memory, demo, settings
│   │   ├── models/database.py   # SQLAlchemy local SQLite metadata persistence
│   │   ├── prompts/             # Defensive SOC investigation prompt templates
│   │   ├── schemas/             # Pydantic schemas for alerts, investigations, feedback
│   │   ├── services/
│   │   │   ├── hindsight_service.py     # Official hindsight-client wrapper (retain, recall, reflect)
│   │   │   ├── investigation_service.py # 5-step investigation pipeline
│   │   │   ├── llm_service.py           # Groq client + defensive heuristic fallback engine
│   │   │   └── feedback_service.py      # Retains analyst feedback into Hindsight bank
│   │   ├── config.py            # Pydantic BaseSettings environment config
│   │   └── main.py              # Application entrypoint & CORS middleware
│   ├── scripts/
│   │   ├── seed_data.py         # 9 rich synthetic MITRE ATT&CK incidents
│   │   ├── seed_memory.py       # Seeds Hindsight bank via client.retain()
│   │   └── test_hindsight.py    # Diagnostic script verifying retain & recall
│   └── tests/
│       └── test_sentinel.py     # 9 pytest test cases (health, pipeline, feedback, fallback)
└── frontend/
    ├── src/
    │   ├── components/          # Navbar, MemoryUsedPanel, ResultCard, Timeline, FeedbackPanel
    │   ├── pages/               # Dashboard, Investigation, History, MemoryExplorer, Learning, Demo, Settings
    │   ├── services/api.ts      # Typed API client connecting to backend
    │   ├── types/index.ts       # TypeScript definitions
    │   ├── App.tsx              # Tab router and root layout
    │   └── index.css            # Tailwind CSS v4 SOC dark-mode theme
    └── vite.config.ts           # Vite bundler with Tailwind CSS and proxy
```

---

## Tech Stack

- **Memory Engine:** Vectorize Hindsight (`hindsight-client` Python SDK)
- **Backend:** Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy, Uvicorn, Pytest
- **Inference:** Groq API (`llama-3.3-70b-versatile`) with built-in heuristic defensive SOC engine fallback
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React
- **Local Persistence:** SQLite (stores application logs while Hindsight maintains institutional memories)

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Vectorize Hindsight Credentials
HINDSIGHT_API_KEY=your_hindsight_api_key_here
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
HINDSIGHT_BANK_ID=sentinel-memory

# Groq LLM Inference (Optional: Heuristic fallback active if omitted)
GROQ_API_KEY=your_groq_api_key_here
LLM_MODEL=llama-3.3-70b-versatile

# Storage & Ports
DATABASE_URL=sqlite:///./sentinel.db
FRONTEND_URL=http://localhost:5173
```

> **Note on Graceful Degradation:** If `HINDSIGHT_API_KEY` is not provided, Sentinel gracefully enters offline standby mode and clearly displays *"Hindsight memory unavailable — investigation running without organizational memory"*. It will never crash.

---

## Quickstart & Local Setup

### 1. Clone & Setup Backend

```bash
# Clone the repository
cd "Sentinal Memory"

# Install Python backend dependencies
python -m pip install hindsight-client fastapi uvicorn pydantic pydantic-settings python-dotenv httpx groq pytest sqlalchemy

# Verify backend tests
python -m pytest backend/tests/test_sentinel.py -v
```

### 2. Seed Hindsight Memory Bank

```bash
# Retains synthetic cybersecurity incidents into Hindsight bank
python backend/scripts/seed_memory.py

# Optional: Run Hindsight diagnostic connectivity test
python backend/scripts/test_hindsight.py
```

### 3. Start Backend Server

```bash
# Runs FastAPI on http://localhost:8000
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Start Frontend

```bash
cd frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## Hackathon Judging Alignment

| Hackathon Criteria | Weight | How Sentinel Memory Addresses It |
|---|---|---|
| **Innovation** | 30% | First AI SOC assistant that eliminates repetitive alert rediscovery by turning analyst triage decisions into persistent organizational memory. |
| **Use of Hindsight Memory** | 25% | **Central to the product.** Implements official `hindsight-client` `retain`, `recall`, and `reflect` APIs across all investigations, memory exploration, and feedback loops. |
| **Technical Implementation** | 20% | Clean, decoupled FastAPI service architecture, Pydantic validation, strict separation of current alert evidence vs historical memory, 100% test pass rate, and graceful fallback. |
| **User Experience** | 15% | Professional SOC dark-mode UI, interactive "Memory Used" transparency panel, visual timeline, interactive checklist playbooks, and 60-second judge demo flow. |
| **Real-world Impact** | 10% | Solves the #1 operational bottleneck in cybersecurity: SOC analyst burnout and repetitive investigation of known benign automation. |

---

## Synthetic Safety Notice

All IP addresses, hostnames, usernames, and command sequences utilized in demo datasets are synthetic and designed exclusively for defensive cybersecurity demonstration purposes.
