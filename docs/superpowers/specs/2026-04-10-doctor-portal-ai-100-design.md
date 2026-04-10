# Doctor Portal AI-100 Design Spec

## Context

EHealth is a multi-role healthcare management system. The Doctor Portal (`/portal/doctor`) currently has 9+ pages with functional UI but **zero AI integration** (only mock responses in AI Assistant page). The goal is to deeply integrate evidence-based AI into every doctor workflow — diagnosis, prescriptions, records, queue, telemedicine — following the "AI 100" standard where AI augments every clinical decision with **traceable, citation-backed suggestions**.

**Key constraint**: AI must NEVER self-reason without sources. All suggestions must come from retrieving medical knowledge base documents (RAG architecture) and must include citations.

---

## Architecture

### Core: RAG (Retrieval-Augmented Generation)

```
Doctor Input → Vector Search (pgvector) → Knowledge Base → AI Synthesize → Result + Citations
```

Every AI call flows through the existing backend `/api/ai/*` endpoints which use pgvector for semantic search against the medical knowledge base before generating responses.

### Knowledge Base Sources

| Category | Sources |
|----------|---------|
| International Guidelines | ESC/ESH 2023, AHA/ACC 2024, ADA 2025, GOLD 2024, WHO ICD-10/11, NICE |
| Drug Databases | DrugBank, Micromedex, FDA Drug Labels, BNF |
| Vietnam Standards | Phac do BYT, Huong dan chan doan & dieu tri BYT, Duoc thu Quoc gia VN, MIMS VN, Danh muc thuoc BHYT |
| Medical References | UpToDate, PubMed, Cochrane Reviews, ICD-10 VN |

### Mandatory Rules

1. Every AI suggestion **MUST** include at least 1 citation with: source name, specific section/table, DOI/document number
2. Confidence score = **match rate against documents**, not model confidence
3. If no matching guideline found → AI displays: "Khong tim thay guideline phu hop. Vui long tham khao y kien chuyen gia."
4. AI failure → form works normally. No AI call blocks page load or form submission
5. All AI suggestions are dismissible. Doctor always has final say.

### Confidence Tiers

| Tier | Range | Color | Meaning |
|------|-------|-------|---------|
| High | ≥85% | Red badge | Strong match with multiple guidelines |
| Medium | 65-84% | Amber badge | Partial match, needs clinical judgment |
| Low | <65% | Blue badge | Weak match, use with caution |

---

## Shared AI Components

All components go in `/src/components/portal/ai/`:

### `<AIConfidenceBadge>`
- Props: `confidence: number`, `sourcesCount: number`, `size: "sm"|"md"`
- Renders: violet pill with % + "N sources confirmed"

### `<AISuggestionPanel>`
- Props: `title`, `children`, `onDismiss`, `confidence?`, `citations: Citation[]`
- Wrapper with violet left border, robot icon, dismiss button
- Collapsible citation block at bottom

### `<AICitationBlock>`
- Props: `citations: Citation[]`
- Yellow background block with expandable citations
- Each citation: evidence level badge + title + excerpt + DOI/document reference

### `<AIHintTooltip>`
- Props: `hint: string`, `citation?: string`, `loading?: boolean`
- Lightweight inline hint for queue pre-exam, prescription refill

### `<AIStatusIndicator>`
- Props: `status: "loading"|"ready"|"error"|"no-evidence"`
- Animated chip showing AI processing state

### `<AIAuditTrailEntry>`
- Props: `timestamp`, `action`, `citation`, `doctorResponse: "accepted"|"dismissed"|"modified"`
- Single audit trail row

---

## New Types

Add to `/src/types/index.ts`:

```typescript
interface Citation {
  id: string;
  source: string;           // "ESC/ESH 2023"
  section: string;           // "Section 7.3"
  excerpt: string;           // Quoted text from source
  evidenceLevel: "A" | "B" | "C" | "BYT_VN" | "Expert";
  reference: string;         // DOI or document number
}

interface AISuggestion {
  id: string;
  type: "diagnosis" | "drug" | "lab" | "vital_alert" | "summary" | "triage";
  content: string;
  confidence: number;        // 0-100, based on document match
  citations: Citation[];
  metadata?: Record<string, any>;
}

interface AIDiagnosisSuggestion extends AISuggestion {
  type: "diagnosis";
  icdCode: string;
  icdDescription: string;
  matchingSymptoms: string[];
  excludeSymptoms: string[];
  suggestedLabs: string[];
}

interface AIDrugCheck {
  drugA: string;
  drugB: string;
  severity: "safe" | "caution" | "serious" | "contraindicated";
  detail: string;
  citations: Citation[];
}

interface AIDrugSuggestion extends AISuggestion {
  type: "drug";
  drugName: string;
  standardDosage: string;
  adjustedDosage?: string;   // Based on weight/eGFR
  interactions: AIDrugCheck[];
  allergyCheck: { safe: boolean; conflictingAllergy?: string };
}

interface AIAuditEntry {
  timestamp: string;
  step: string;
  aiAction: string;
  citations: Citation[];
  doctorResponse: "accepted" | "dismissed" | "modified";
  notes?: string;
}

interface AIPreferences {
  enableExamSuggestions: boolean;
  enableAutoSymptomAnalysis: boolean;
  enableDashboardBriefing: boolean;
  enableDrugInteractionCheck: boolean;
  confidenceThreshold: number;  // 0-100, default 60
  enableSessionMemory: boolean;
  enableAutoNotes: boolean;
}
```

---

## AI Service Extensions

Extend `/src/services/aiService.ts`:

```typescript
// Existing endpoints (already defined):
// chat, checkSymptoms, suggestAppointment, summarizeRecord, analyze, getLogs

// New methods needed:
aiService = {
  ...existing,
  
  // Vital anomaly detection
  checkVitals: (data: { vitals, patientAge, patientHistory }) 
    => POST /api/ai/analyze { type: "vital_anomaly", ...data },
  
  // Diagnosis with citations
  getDiagnosis: (data: { symptoms, vitals, patientHistory }) 
    => POST /api/ai/symptom-check (enhanced response with citations),
  
  // Drug interaction check
  checkDrugInteraction: (data: { drugs, allergies, patientProfile }) 
    => POST /api/ai/analyze { type: "drug_interaction", ...data },
  
  // Drug suggestion
  suggestDrug: (data: { diagnosis, patientProfile }) 
    => POST /api/ai/chat { context: { type: "drug_suggestion" } },
  
  // ICD-10 lookup
  lookupICD10: (query: string) 
    => POST /api/ai/chat { context: { type: "icd_lookup" } },
  
  // Patient summary
  summarizePatient: (patientId: string) 
    => GET /api/ai/summarize/{patientId},
  
  // Daily briefing
  getDailyBriefing: (doctorId: string) 
    => POST /api/ai/analyze { type: "daily_briefing" },
  
  // Lab trend detection
  detectTrends: (data: { timeline, patientId }) 
    => POST /api/ai/analyze { type: "lab_trend", ...data },
  
  // Prescription safety audit
  auditPrescription: (data: { prescriptions, patientProfiles }) 
    => POST /api/ai/analyze { type: "prescription_audit", ...data },
  
  // Triage assessment
  triageAssessment: (data: { reason, patientAge, history }) 
    => POST /api/ai/symptom-check (with triage context),
  
  // AI preferences
  getPreferences: (doctorId: string) => GET /api/ai/preferences/{doctorId},
  savePreferences: (doctorId: string, prefs: AIPreferences) 
    => PUT /api/ai/preferences/{doctorId},
};
```

---

## Page-by-Page Design

### 1. Dashboard (`/portal/doctor`)

**AI Features:**

1. **AI Daily Briefing Card** — Full-width card after stats cards
   - Trigger: Proactive on page load (calls `getDailyBriefing`)
   - Content: 3 columns — Allergy warnings, Follow-up alerts, Performance insights
   - Each item cites patient records + relevant guidelines
   - Dismiss: sessionStorage, "Don't show today" option
   - Refresh button to regenerate

2. **AI Next-Patient Pre-Brief** — Inside existing "Benh nhan tiep theo" card
   - Trigger: Proactive when card mounts with patient ID (calls `summarizePatient`)
   - Content: Chief complaint history, last diagnosis, red flags, allergies
   - Citations: From patient's EMR + relevant guidelines for chronic conditions
   - Collapsible

3. **AI Workload Optimizer** — Single-line hint in progress section
   - Trigger: Proactive (calls `suggestAppointment`)
   - Content: Redistribution suggestion with link to Appointments page

**API calls:** `/api/ai/analyze` (daily_briefing), `/api/ai/summarize/{id}`, `/api/ai/suggest-appointment`

### 2. Appointments (`/portal/doctor/appointments`)

**AI Features:**

1. **AI Smart Triage** — Badge on each pending request
   - Trigger: Proactive when pending list loads (batch `triageAssessment`)
   - Content: Urgency badge (Urgent/Routine/Elective) + reasoning + citation
   - Example: "Dau nguc khi gang suc" o nam 65T → ESC 2023 NSTE-ACS

2. **AI Follow-up Tracker** — Banner above calendar
   - Trigger: Proactive (calls `analyze` with type: "follow_up_tracking")
   - Content: Overdue follow-ups with guideline-recommended intervals
   - Citation: Specific guideline for each follow-up interval

3. **AI Schedule Conflict Detector** — Amber badges on calendar cells
   - Trigger: Proactive on week view load
   - Content: Tooltip showing complexity warning for back-to-back high-risk patients

**API calls:** `/api/ai/symptom-check`, `/api/ai/analyze`

### 3. Queue (`/portal/doctor/queue`)

**AI Features:**

1. **AI Priority Mode** — Toggle button at top of queue
   - Trigger: On-demand (doctor clicks toggle)
   - Content: Re-ranks queue by AI-predicted urgency with colored badges
   - Each urgency rating cites clinical guideline for the condition
   - Doctor manually re-assigns — AI only suggests

2. **AI Wait Time Anomaly Alert** — Fixed amber banner
   - Trigger: Proactive, polls every 5 min via useEffect
   - Content: Patients waiting >45min with urgent conditions
   - Citation: Guideline-based time-to-treatment (e.g., AHA chest pain: evaluate in 10min)

3. **AI Pre-Examination Hint** — Inline panel when clicking "Bat dau kham"
   - Trigger: On-demand (popover opens → calls `summarizePatient`)
   - Content: Last visit summary, red flags, medication, allergies
   - Citations from patient EMR + relevant chronic condition guidelines

**API calls:** `/api/ai/symptom-check`, `/api/ai/summarize/{id}`, `/api/ai/analyze`

### 4. Examination (`/portal/doctor/examination`) — HIGHEST PRIORITY

**Step 0 — Vitals: AI Anomaly Detection**
- Trigger: Proactive when "Next" clicked (calls `checkVitals`)
- UI: `<AIVitalAlertBanner>` slides down from step header
- Content: Specific anomaly + clinical assessment checklist (4 organ systems) + suggested labs with priority levels
- Citations: ESC/ESH, AHA/ACC, BYT guidelines with specific section numbers
- Dismissible, color-coded by confidence tier

**Step 1 — Symptoms: AI Symptom Analyzer**
- Trigger: Debounced (1500ms after typing stops) + on-demand "Analyze" button
- UI: `<AISymptomAnalyzer>` panel below symptom textarea
- Content: 3-5 differential diagnoses ranked by match rate
  - Each expandable: matching symptoms (check), exclude symptoms (x), sensitivity/specificity, guideline reference
  - "Dung" button auto-fills Step 3 (diagnosis + ICD code)
  - Suggested labs auto-highlighted in Step 2
- Citations: Mandatory per diagnosis — specific guideline + section + evidence level

**Step 2 — Labs: AI Lab Recommendation**
- Trigger: Proactive (data from Step 1 AI call, no additional API call)
- UI: Lab checkboxes with violet border + "AI Recommended" + priority badge (urgent/necessary/supplementary)
- Content: Each recommended lab shows reason + which diagnosis it rules in/out
- Click to auto-select

**Step 3 — Diagnosis: AI ICD-10 Autocomplete + Validation**
- ICD-10 autocomplete: On-demand as doctor types (calls `lookupICD10`)
- Diagnosis validation: On-demand "Validate" button (calls `analyze` with type: "diagnosis_consistency")
- UI: Dropdown for ICD-10, consistency score panel
- Content: ICD code + description + consistency check (symptoms/vitals/diagnosis alignment)
- Citation: WHO ICD-10 + relevant clinical guideline

**Step 4 — Prescriptions: AI Drug Intelligence**
- Drug autocomplete: On-demand as doctor types drug name (calls `suggestDrug`)
- Interaction check: Proactive on each drug add (calls `checkDrugInteraction`)
  - Interaction matrix table: Drug A × Drug B, severity, detail, citation
  - Allergy cross-check: Auto against patient profile
  - RED banner for serious/contraindicated — requires acknowledge
- Dosage optimization: Proactive based on weight/age/eGFR
  - Inline hint next to dosage field
- Citations: DrugBank, Micromedex, FDA Labels, Duoc thu Quoc gia VN

**Step 5 — Summary: AI Auto-Summary + Audit Trail**
- Auto-summary: On-demand "Generate AI Summary" button (calls `summarizeRecord` after draft save)
  - SOAP format: Subjective, Objective, Assessment, Plan
  - Doctor can edit freely before signing
- AI Audit Trail: Proactive (generated from session data)
  - Timeline of every AI interaction during this examination
  - Each entry: timestamp, AI action, citation, doctor response (accepted/dismissed/modified)
  - Saved to EMR for quality assurance and legal compliance

**API calls:** `/api/ai/analyze`, `/api/ai/symptom-check`, `/api/ai/chat`, `/api/ai/summarize/{id}`

### 5. Medical Records (`/portal/doctor/medical-records`)

**AI Features:**

1. **AI Record Summarizer** — Collapsible card at top
   - Trigger: On-demand "Summarize History" button (calls `summarizePatient`)
   - Content: Chronic conditions, medication history, allergy profile
   - Citations: From each relevant EMR entry + chronic condition guidelines
   - "Last generated" timestamp + refresh button

2. **AI Trend Detector** — Inline annotations on timeline
   - Trigger: Proactive on patient record load (calls `detectTrends`)
   - Content: Abnormal lab value trends with mini chart visualization
   - Example: Glucose 5.8→6.4→7.2 mmol/L — "Pre-diabetic trend" with ADA 2025 citation
   - Violet chip on affected timeline rows, expandable on click

3. **AI Cross-Visit Anomaly** — On-demand "AI Insights" button
   - Content: Inconsistencies between visits (different diagnosis for same symptoms, etc.)
   - Citations from both visit records + relevant guidelines

**API calls:** `/api/ai/summarize/{id}`, `/api/ai/analyze`

### 6. Prescriptions (`/portal/doctor/prescriptions`)

**AI Features:**

1. **AI Prescription Safety Scanner** — "Run AI Safety Check" button in header
   - Trigger: On-demand (calls `auditPrescription`)
   - Content: Flags per prescription — contraindications, interaction risks, dosage issues
   - Each flag: severity badge + detail + specific citation (FDA, DrugBank, BYT)
   - Collapsible `<AIAuditPanel>` above table

2. **AI Refill Predictor** — Inline chip in status column
   - Trigger: Proactive, computed from dosage × duration with AI confirmation
   - Content: "Refill likely in ~N days"

3. **AI Drug Intelligence in New Prescription** — Same as Examination Step 4
   - Drug autocomplete, interaction check, ICD-10 autocomplete, dosage optimization

**API calls:** `/api/ai/analyze`, `/api/ai/chat`

### 7. AI Assistant (`/portal/doctor/ai-assistant`)

**Enhancements:**

1. **Context Sidebar** — Left panel to pin patient/visit context
   - All subsequent chat messages include pinned context in API payload
   - "Add context" / "Clear context" buttons
   - Shows: current patient, active examination step

2. **Structured Quick Prompts** — Expanded with mini-forms
   - ICD-10 Lookup: text input → structured query
   - Drug Interaction: Drug A + Drug B inputs → structured check
   - Protocol: diagnosis input → treatment protocol query
   - All responses include full citations

3. **AI Log Viewer Tab** — Second tab "Lich su AI"
   - Calls `getLogs` with lazy loading
   - Shows: all AI interactions with timestamps, prompts, responses
   - Filterable by type, date

4. **Deep Analysis Mode** — Toggle in header
   - Sends full conversation history in each API call
   - AI considers multi-turn context for deeper reasoning

**API calls:** `/api/ai/chat`, `/api/ai/logs`

### 8. Telemedicine (`/portal/doctor/telemedicine`)

**AI Features:**

1. **AI Pre-Session Briefing** — Forced-read modal before entering room
   - Trigger: On "Join Session" click (calls `summarizePatient`)
   - Content: Patient brief — chronic conditions, medications, purpose, red flags
   - AI discussion suggestions with guideline references
   - "Da doc — Vao phong kham" button required

2. **AI Chat Assist** — Collapsed button in chat panel
   - Trigger: On-demand "AI Draft Response"
   - Content: AI drafts clinical response based on patient's message + profile
   - Doctor edits before sending — AI draft never auto-sends

3. **AI Session Note Generator** — Post-call modal
   - Trigger: On room close
   - Content: Pre-filled clinical notes from chat history + session data
   - SOAP format, doctor approves before saving to EMR
   - Full citations for any clinical suggestions made during session

**API calls:** `/api/ai/summarize/{id}`, `/api/ai/chat`, `/api/ai/analyze`

### 9. Settings (`/portal/doctor/settings`)

**New "AI Preferences" Tab:**

Toggles:
- Enable AI suggestions during examination (default: on)
- Auto-analyze symptoms when typing stops (default: on)
- Show AI briefing on dashboard (default: on)
- Enable auto drug interaction check (default: on)
- Enable AI session memory in AI Assistant (default: on)
- Allow AI to pre-fill clinical notes (default: on)

Slider:
- Confidence threshold: 0-100% (default: 60%) — only show suggestions above threshold

AI Usage Statistics (read-only):
- Total suggestions this month
- Acceptance rate
- Most used features (breakdown)
- Calls `getLogs` with aggregate parameter

Disclaimer card:
- Static info about AI being support-only, doctor retains full clinical responsibility

**API calls:** `/api/ai/preferences/{doctorId}`, `/api/ai/logs`

---

## AI Preferences Store

Create `/src/store/aiPreferencesStore.ts` — localStorage-backed store:
- Loaded once on portal layout mount
- Consumed by all AI components via `useAIPreferences()` hook
- Respects toggles (e.g., if `enableAutoSymptomAnalysis: false`, Step 1 debounced call is skipped)
- **Phase 1**: localStorage only (no backend dependency)
- **Phase 4**: Optionally sync to backend via `PUT /api/ai/preferences/{doctorId}` if endpoint available

---

## New API Endpoints Needed

Add to `/src/api/endpoints.ts` under `AI_ENDPOINTS`:

```
VITAL_CHECK: '/api/ai/analyze'           // type: "vital_anomaly"
DIAGNOSIS: '/api/ai/symptom-check'        // enhanced with citations
DRUG_INTERACTION: '/api/ai/analyze'       // type: "drug_interaction"
DRUG_SUGGEST: '/api/ai/chat'              // context: { type: "drug_suggestion" }
ICD10_LOOKUP: '/api/ai/chat'              // context: { type: "icd_lookup" }
DAILY_BRIEFING: '/api/ai/analyze'         // type: "daily_briefing"
LAB_TREND: '/api/ai/analyze'              // type: "lab_trend"
PRESCRIPTION_AUDIT: '/api/ai/analyze'     // type: "prescription_audit"
FOLLOW_UP_TRACKING: '/api/ai/analyze'     // type: "follow_up_tracking"
TRIAGE: '/api/ai/symptom-check'           // with triage context
AI_PREFERENCES: (id) => `/api/ai/preferences/${id}`
```

All use existing base endpoints with different `type` parameters — no new backend routes needed initially.

---

## Implementation Phases

### Phase 1: Foundation + Examination (Highest Impact)
1. Shared AI components (`/src/components/portal/ai/`)
2. AI types and service extensions
3. AI preferences store
4. Examination: Step 0 vitals alert, Step 1 symptom analyzer, Step 3 ICD-10 autocomplete, Step 4 drug interaction
5. Examination: Step 5 audit trail

### Phase 2: Core Portal Pages
6. Dashboard: AI briefing card + next-patient pre-brief
7. Queue: AI priority mode + wait time alert + pre-exam hint
8. AI Assistant: Context sidebar + structured prompts + log viewer

### Phase 3: Records & Prescriptions
9. Medical Records: AI summarizer + trend detector
10. Prescriptions: Safety scanner + drug intelligence in new prescription form

### Phase 4: Remaining + Polish
11. Appointments: AI triage + follow-up tracker
12. Telemedicine: Pre-session briefing + session notes
13. Settings: AI preferences tab
14. Testing and refinement across all pages

---

## Verification Plan

1. **Unit tests**: Each shared AI component renders correctly with mock data
2. **Integration tests**: AI service calls return expected response structure with citations
3. **E2E test**: Complete examination flow (Steps 0-5) with AI suggestions at each step
4. **Edge cases**:
   - AI API timeout → form still works, shows "AI temporarily unavailable"
   - No matching guideline → shows "no evidence" fallback
   - Low confidence (<threshold) → suggestion hidden per user preferences
5. **Manual testing**: Run through each portal page and verify AI panels appear/dismiss correctly
6. **Citation verification**: Every AI suggestion must include at least 1 citation — test with missing citation response

---

## Critical Files

### Files to modify:
- `/src/app/portal/doctor/page.tsx` — Dashboard AI briefing
- `/src/app/portal/doctor/examination/page.tsx` — All 6 steps AI
- `/src/app/portal/doctor/queue/page.tsx` — Priority + hints
- `/src/app/portal/doctor/medical-records/page.tsx` — Summarizer + trends
- `/src/app/portal/doctor/prescriptions/page.tsx` — Safety scanner
- `/src/app/portal/doctor/ai-assistant/page.tsx` — Context + structured prompts
- `/src/app/portal/doctor/telemedicine/page.tsx` — Pre-brief + notes
- `/src/app/portal/doctor/settings/page.tsx` — AI tab
- `/src/app/portal/doctor/appointments/page.tsx` — Triage + follow-up
- `/src/services/aiService.ts` — New methods
- `/src/api/endpoints.ts` — New AI endpoints
- `/src/types/index.ts` — AI types

### Files to create:
- `/src/components/portal/ai/AIConfidenceBadge.tsx`
- `/src/components/portal/ai/AISuggestionPanel.tsx`
- `/src/components/portal/ai/AICitationBlock.tsx`
- `/src/components/portal/ai/AIHintTooltip.tsx`
- `/src/components/portal/ai/AIStatusIndicator.tsx`
- `/src/components/portal/ai/AIAuditTrail.tsx`
- `/src/components/portal/ai/index.ts`
- `/src/store/aiPreferencesStore.ts`
- `/src/hooks/useAIPreferences.ts`
- `/src/constants/ai.ts`
