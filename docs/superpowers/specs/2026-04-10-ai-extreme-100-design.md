# 100% AI Extreme — Full Spec

## Context

EHealth AI hiện ở mức 25-30%. AI chỉ là addon panels, reactive, giới hạn Doctor portal. Mục tiêu: nâng lên 100% AI Extreme — AI là interface CHÍNH, proactive, ambient, xuyên suốt 5 portal.

**9 subsystem cần build:**

1. AI Proactive + Ambient Engine
2. Deep Portal Integration (5 portal)
3. AI Smart Search
4. Voice + Multimodal
5. AI Onboarding + Tutorial
6. Cross-Patient Intelligence
7. Adaptive UI
8. AI Collaborative
9. AI Gamification

---

## Subsystem 1: AI Proactive + Ambient Engine

**Paradigm shift:** AI TỰ HÀNH ĐỘNG → user confirm. Không chờ user hỏi.

### Components:

**`useAIAmbientEngine` hook** — Background loop theo dõi `pageContext.formData`. Khi data thay đổi (debounce 1500ms):
- Doctor: checkVitals → vital alerts, getDiagnosis → suggestion
- Pharmacist: checkDrugInteraction → drug alerts
- Receptionist: triageAssessment → urgency
- Patient: medication adherence check
- Admin: system anomaly polling

**`AIProactiveNotifications`** — Alert cards trong Copilot sidebar. Critical=đỏ, Warning=vàng, Info=xanh. Mỗi alert có "Áp dụng" button.

**`AIStatusBadge` trên Header** — Mọi portal header hiện: "AI: Đang phân tích..." / "2 cảnh báo" / "✓ Sẵn sàng". Click → expand copilot.

**`AIFormFieldEnhancer`** — Wrapper cho `<input>`. Khi AI có suggestion:
- Viền violet nhấp nháy (animate-pulse)
- Ghost text hiện giá trị gợi ý
- "Enter chấp nhận · Esc bỏ qua"
- Confidence > 80% → tự điền, user confirm

**`AIPulseIndicator`** — Chấm 6px violet animate-ping trên field đang được AI phân tích.

**`useAIAutoFill` hook** — Confidence gating: confidence >= threshold → auto-populate field + highlight. User Enter=accept, Esc=reject.

### Context mở rộng:
```
AICopilotContext += {
  proactiveAlerts: AIProactiveAlert[]
  pushAlert / dismissAlert / clearAlerts
  engineStatus: 'idle' | 'analyzing' | 'alert' | 'ready'
  alertCount (computed)
}
```

### Toast mở rộng:
```
ToastContext += toast type 'ai' (violet, 8000ms, "View Details" button)
```

### Files:
- Create: `hooks/useAIAmbientEngine.ts`, `hooks/useAIAutoFill.ts`
- Create: `components/ai-copilot/AIStatusBadge.tsx`, `AIProactiveNotifications.tsx`
- Create: `components/shared/AIFormFieldEnhancer.tsx`, `AIPulseIndicator.tsx`
- Modify: `contexts/AICopilotContext.tsx`, `contexts/ToastContext.tsx`
- Modify: 5 portal headers (doctor/pharmacist/receptionist/patient/admin-header.tsx)
- Modify: `AICopilotSidebar.tsx`

---

## Subsystem 2: Deep Portal Integration

### Doctor Portal
- `useAIAmbientEngine()` trên examination page
- Wrap vital inputs với `AIFormFieldEnhancer`
- Prescription: real-time drug interaction khi gõ (không chờ submit)

### Pharmacist Portal
- **`AIDispensingAssistant`**: Khi mở prescription → AI auto-check tương tác + liều + dị ứng
- **`AIInventoryPredictor`**: Dashboard widget "Amoxicillin sắp hết (3 ngày), gợi ý đặt 200 viên"
- `usePageAIContext` + `useAIAmbientEngine` trên dispensing page

### Receptionist Portal
- **`AITriageAssistant`**: Khi nhập lý do khám → AI auto-assess urgency
- **`AISchedulingOptimizer`**: "Slot 14:30 BS. Nguyễn phù hợp nhất"
- **`AIQueuePredictor`**: "Thời gian chờ dự kiến: 25 phút" real-time
- `usePageAIContext` + `useAIAmbientEngine` trên reception page

### Patient Portal
- **`AISymptomCheckerWidget`**: Interactive widget trên dashboard (không phải link)
- **`AIHealthCoach`**: Tips proactive "Nhắc: uống Metformin trước bữa ăn 30p"
- **`AIAppointmentSuggester`**: "Bạn nên tái khám Tim mạch trước 15/05"

### Admin Portal
- **`AISystemMonitor`**: Real-time anomaly detection
- **`AIPredictiveAnalytics`**: "Lượng BN tăng 20% tuần tới"
- **`AIStaffingOptimizer`**: "Thiếu 2 BS Tim mạch chiều T4"
- **`AIRevenueInsight`**: "Doanh thu giảm 8%, nguyên nhân: giảm khám ngoại trú"

### Files:
- Create 12 portal-specific components
- Modify 5 portal dashboard pages + key form pages

---

## Subsystem 3: AI Smart Search

**`AISearchBar`** — Thay thế search input trên 5 portal headers.
- Natural language: "BN THA dùng metformin"
- Fuzzy/semantic matching
- As-you-type dropdown: grouped results (Patients, Medicines, Appointments, Records)
- Role-filtered: doctor thấy patients+records, pharmacist thấy medicines

**`AIGlobalSearch` (Cmd+Shift+K)** — Full-page overlay.
- Cross-entity search
- Recent searches (localStorage)
- Keyboard navigable

### Files:
- Create: `components/ai-copilot/AISearchBar.tsx`, `AIGlobalSearch.tsx`
- Modify: 5 portal headers (replace plain search input)
- Modify: `portal-shell.tsx` (global Cmd+Shift+K listener)

---

## Subsystem 4: Voice + Multimodal

**`useVoiceInput` hook** — Web Speech API, lang="vi-VN".
- `startListening()`, `stopListening()`, `transcript`, `isListening`, `isSupported`

**`AIVoiceInputButton`** — Nút mic.
- Idle: mic icon → Listening: red pulse + "Đang nghe..." → Done
- Đặt trong CopilotInput + key form fields (doctorNote, symptoms)

**`AIVoiceDictation`** — Doctor đọc ghi chú → real-time transcription → AI format SOAP.
- Continuous mode, live display, "Áp dụng" populates doctorNote

**`AIImageAnalysis`** — Upload ảnh kết quả XN / đơn thuốc.
- File input (image/*, pdf) → preview → `aiService.analyze({ type: 'image_ocr' })` → extracted values → "Điền vào form"

### Files:
- Create: `hooks/useVoiceInput.ts`
- Create: `components/ai-copilot/AIVoiceInputButton.tsx`
- Create: `components/portal/ai/AIVoiceDictation.tsx`, `AIImageAnalysis.tsx`
- Modify: `CopilotInput.tsx` (add mic button)

---

## Subsystem 5: AI Onboarding + Tutorial

**`AIOnboardingModal`** — First-visit welcome flow.
- Detect first visit via localStorage `ehealth_ai_onboarded_<role>`
- Step-by-step tour:
  1. "Chào mừng! AI Copilot luôn ở bên phải bạn"
  2. "Thử gõ /icd viêm phổi để tra ICD-10"
  3. "AI tự phân tích khi bạn nhập dữ liệu"
  4. "Bấm Cmd+K để mở Command Palette"
  5. "Bấm Cmd+Shift+K để tìm kiếm thông minh"
- Role-specific steps (doctor vs pharmacist vs patient)
- "Bỏ qua" button, "Đánh dấu đã xem" checkbox
- Confetti/celebration animation on complete

**`AIFeatureHighlight`** — Pulse spotlight trên feature chưa từng dùng.
- Track feature usage in localStorage
- Nếu user chưa dùng /diagnose sau 3 ngày → highlight nút với tooltip "Thử tính năng này!"

### Files:
- Create: `components/ai-copilot/AIOnboardingModal.tsx`
- Create: `components/ai-copilot/AIFeatureHighlight.tsx`
- Modify: `portal-shell.tsx` (render onboarding modal on first visit)

---

## Subsystem 6: Cross-Patient Intelligence

**`AICrossPatientInsight`** — Dashboard widget cho Doctor + Admin.
- Calls `aiService.analyze({ type: 'cross_patient_pattern' })`
- "5 ca viêm phổi tuần này — có thể là dịch. Gợi ý: xét nghiệm thêm CRP cho BN tiếp theo"
- "BN hiện tại giống 3 ca trước đã respond tốt với Amoxicillin + Azithromycin"

**`AISimilarCases`** — Trong examination page, khi có diagnosis.
- "3 ca tương tự trong 30 ngày qua: 2 dùng phác đồ A (thành công), 1 dùng phác đồ B (tái khám)"
- Click để xem chi tiết case (anonymized)

### Files:
- Create: `components/portal/ai/AICrossPatientInsight.tsx`
- Create: `components/portal/ai/AISimilarCases.tsx`
- Modify: Doctor dashboard + examination page

---

## Subsystem 7: Adaptive UI

**`useAIAdaptiveUI` hook** — Theo dõi thời gian, hành vi user.
- Ban đêm (20:00-06:00): tự chuyển dark mode nếu chưa
- Cuối ca (sau 6h liên tục): AI suggestions gọn hơn (compact mode), giảm animations
- Phát hiện user dismiss nhiều suggestions → giảm frequency
- Phát hiện user accept nhiều → tăng confidence threshold

**`AICompactMode`** — Khi detected fatigue:
- Suggestion cards thu gọn 1 dòng thay vì 3
- Giảm animation speed
- Tăng font size nhẹ
- Thêm "Nghỉ ngơi 5 phút?" suggestion

### Files:
- Create: `hooks/useAIAdaptiveUI.ts`
- Modify: `AICopilotSidebar.tsx`, `RolePageSuggestions.tsx` (consume compact mode)
- Modify: `constants/ai.ts` (add adaptive thresholds)

---

## Subsystem 8: AI Collaborative

**`AICollaborativeAlert`** — Phát hiện 2+ users trên cùng BN.
- Track active sessions per patient via `pageContext.patientId`
- "BS. Trần cũng đang xem BN này — liên hệ trước khi kê đơn"
- Highlight conflicting actions (2 BS kê thuốc khác nhau)

**`AIHandoffBriefing`** — Khi đổi ca.
- AI tạo briefing: "5 BN chưa hoàn thành, 2 cần tái khám, 1 chờ kết quả XN"
- Trigger khi user logout hoặc khi shift change time

**`AIRoleBridge`** — AI mediate giữa roles.
- BS gửi đơn thuốc → AI tóm tắt cho Dược sĩ: "BN Nguyễn, THA, Amoxicillin 500mg — lưu ý dị ứng Penicillin!"
- Lễ tân chuyển BN → AI brief cho BS: "BN mới, 65t, đau ngực, urgent"

### Files:
- Create: `components/ai-copilot/AICollaborativeAlert.tsx`
- Create: `components/ai-copilot/AIHandoffBriefing.tsx`
- Create: `components/ai-copilot/AIRoleBridge.tsx`
- Modify: `AICopilotSidebar.tsx` (embed collaborative alerts)

---

## Subsystem 9: AI Gamification

**`AIUsageTracker`** — Track AI feature usage per user.
- localStorage: `{ totalSuggestions, accepted, dismissed, commandsUsed, streak, badges }`
- Weekly/monthly stats

**`AIGamificationBadge`** — Header widget.
- "🔥 Streak 5 ngày dùng AI liên tục"
- "🏆 AI Expert — 100+ gợi ý được chấp nhận"
- Badges: "First Diagnosis" "Drug Checker" "Voice Master" "100 Commands"

**`AILeaderboard`** — Admin dashboard widget.
- "Top 5 BS dùng AI nhiều nhất tuần này"
- "BS Nguyễn: 47 gợi ý, 81% acceptance rate"
- Khuyến khích adoption

**`AIWeeklySummary`** — Popup cuối tuần.
- "Tuần này bạn dùng AI 47 lần, tiết kiệm ~2.5 giờ"
- "Tính năng hay dùng nhất: ICD-10 Lookup (22 lần)"
- Share button (optional)

### Files:
- Create: `hooks/useAIUsageTracker.ts`
- Create: `components/ai-copilot/AIGamificationBadge.tsx`
- Create: `components/portal/ai/AILeaderboard.tsx`
- Create: `components/ai-copilot/AIWeeklySummary.tsx`
- Modify: Portal headers (add gamification badge)
- Modify: Admin dashboard (add leaderboard)

---

## New aiService Methods

```
forecastInventory, predictQueue, detectSystemAnomalies,
optimizeStaffing, getRevenueInsight, semanticSearch,
analyzeImage, crossPatientPattern, similarCases,
handoffBriefing, roleBridgeSummary
```

## New AIPreferences

```
enableAmbientEngine, enableProactiveAlerts, enableVoiceInput,
enableSmartSearch, enableImageAnalysis, enableAdaptiveUI,
enableCollaborativeAlerts, enableGamification,
ambientEngineInterval (ms), autoFillConfidenceThreshold (%)
```

---

## Implementation Phases

### Phase 1: Core Infrastructure
- Extend AICopilotContext + ToastContext
- Create useAIAmbientEngine, useAIAutoFill, useAIAdaptiveUI hooks
- AIStatusBadge + AIPulseIndicator + AIFormFieldEnhancer
- AIProactiveNotifications in sidebar

### Phase 2: Header + Search + Voice
- AISearchBar on all 5 headers
- AIGlobalSearch overlay (Cmd+Shift+K)
- useVoiceInput + AIVoiceInputButton in CopilotInput

### Phase 3: Deep Portal — Doctor + Pharmacist
- Doctor: Ambient engine on exam + field enhancers + voice dictation + image analysis
- Pharmacist: AIDispensingAssistant + AIInventoryPredictor
- Cross-Patient Intelligence on Doctor dashboard

### Phase 4: Deep Portal — Receptionist + Patient + Admin
- Receptionist: AITriageAssistant + AISchedulingOptimizer + AIQueuePredictor
- Patient: AISymptomCheckerWidget + AIHealthCoach + AIAppointmentSuggester
- Admin: 4 AI dashboard widgets + AILeaderboard

### Phase 5: Onboarding + Collaborative + Gamification + Adaptive
- AIOnboardingModal + AIFeatureHighlight
- AICollaborativeAlert + AIHandoffBriefing + AIRoleBridge
- AIGamificationBadge + AIWeeklySummary + AIUsageTracker
- useAIAdaptiveUI + compact mode

### Phase 6: Polish + Settings
- Update AISettingsTab with all new toggles
- aiService extensions (11 new methods)
- role-suggestions.ts extensions
- Testing + refinement

---

## Verification

1. Mở Doctor portal → AI tự phân tích vitals khi gõ → alert toast xuất hiện
2. Form field nhấp nháy violet khi AI có suggestion → Enter accept
3. Pharmacist: mở đơn thuốc → AI auto-check tương tác → badge trên header
4. Receptionist: nhập lý do → AI triage badge xuất hiện real-time
5. Patient: widget symptom checker trên dashboard → step-by-step
6. Admin: 4 AI widget trên dashboard → dữ liệu dự báo
7. Cmd+K → command palette | Cmd+Shift+K → global search
8. Voice: click mic → nói tiếng Việt → transcript real-time
9. First visit: onboarding modal → tutorial steps
10. Header: AIStatusBadge + Gamification badge hiện trên mọi portal

## Total Files: ~45 new + ~25 modified
