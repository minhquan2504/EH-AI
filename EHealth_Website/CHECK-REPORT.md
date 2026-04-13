# BÁO CÁO KIỂM TRA TOÀN DIỆN — EHealth Frontend

> Ngày: 2026-04-13
> Phạm vi: 88 pages, 36 services, 130 endpoint groups (1100+ API methods)
> Phương pháp: 6 agents parallel scan theo 7 phase của CHECK-PLAN.md

## TÓM TẮT

| Phase | Kết quả | Status |
|-------|---------|--------|
| 1. Static Analysis | 0 dead code, 525 `any` casts, 0 circular import | ✅ Pass |
| 2. Build & Runtime | **Build SUCCESS** 79 static pages, 41 useEffect missing deps | ⚠️ Warnings |
| 3. UX/Business Logic | 12 P0, 18 P1, 12 P2 issues | ❌ Critical |
| 4. Security | 0 critical, 1 high, 3 medium, 4 low | ✅ Good |
| 5. A11y/i18n/Responsive | A11y 4/10, i18n 7/10, Responsive 6/10 | ⚠️ Warnings |
| 6. Dependencies | All used, no missing | ✅ Pass |
| 7. Documentation | 7.5/10, PLAN.md chưa tick | ⚠️ Needs update |

---

## DANH SÁCH P0 — CRITICAL (Phải fix trước khi demo)

### UX/Business Logic (12)

1. **[booking]** Step 5 `catch` fallback hiển thị "thành công" khi API fail → `setBookingCode` + `setStep(5)` trong catch block. File: `src/app/(public)/booking/page.tsx`
2. **[patient/appointments]** Nút "Đánh giá" không có onClick handler → dead button
3. **[doctor/examination]** `simulateLabResults()` trả mock data hardcode trong production code (WBC: 7.2, Glucose: 95...)
4. **[doctor/telemedicine]** 2 chat messages hardcode luôn xuất hiện trong room
5. **[doctor/medical-records]** `usePageAIContext` hardcode `patientId: "BN001"`, `patientName: "Nguyễn Văn An"`
6. **[admin/hospitals]** Nút "Thêm cơ sở mới" không có onClick — dead button
7. **[pharmacist/inventory]** `showRequestModal` form submit chỉ update local state, không gọi API
8. **[receptionist/queue]** `handleTransfer` chỉ update local state, không gọi API
9. **[patient/patient-profiles]** Toàn bộ CRUD localStorage, không có API
10. **[patient/medication-reminders]** Toàn bộ CRUD localStorage, không sync backend
11. **[patient/profile]** Tab "Lịch sử khám" và "Kết quả" là static placeholder
12. **[pharmacist/prescriptions]** `INTERACTION_WARNINGS = {}` hardcode — feature drug interaction là placeholder

### Build/Runtime (3)

13. **41 `useEffect` thiếu dependency array** — fetch lại mỗi re-render
14. **`new Date()` trong JSX** gây hydration mismatch (2 chỗ: pharmacist/inventory/import, patient/appointments)
15. **`metadataBase` chưa set** → social OG/Twitter images resolve về localhost

### Accessibility (2)

16. **~195 inputs dùng placeholder thay label** — screen reader không đọc được
17. **Modal thiếu `role="dialog"`, `aria-modal`, focus trap** (2 modal components + 15+ inline modals)

---

## DANH SÁCH P1 — HIGH PRIORITY

### UX/Business Logic (18)

1. **[patient/profile]** Tab "Người thân" không load data cũ từ API
2. **[patient/health-records]** 6 tabs không hiển thị error message khi API fail
3. **[booking]** `getSelectedServiceObj()` hard-return null
4. **[patient/billing]** QR payment polling không có timeout
5. **[patient/billing]** Error message misleading "đang hiển thị dữ liệu mẫu" nhưng invoices rỗng
6. **[receptionist/reception]** `doctorId` lookup bằng string thay vì ID
7. **[receptionist/reception]** `createPatient` không convert age → date_of_birth
8. **[receptionist/billing/new]** Không có fallback khi catalog API rỗng
9. **[receptionist/appointments]** Filter theo dept là local, không re-fetch API
10. **[receptionist/appointments/new]** Form không validate required fields
11. **[receptionist/patients/[id]]** Upload document lỗi chỉ alert, không toast
12. **[doctor/appointments]** Calendar mapping appointment.date/time → calendar slot không thấy implement
13. **[doctor/appointments/manage-slots]** `maxPatients` hardcode "20", không load từ API
14. **[doctor/telemedicine]** Chat messages initialization hardcode 2 messages cũ
15. **[pharmacist/inventory]** Requests list không load từ API
16. **[admin/statistics]** `getDashboard()` không re-fetch khi đổi timeRange
17. **[admin/users]** Không có error state display
18. **[admin/activity-logs]** Không có loading state, date filter là local

### Security (1)

19. **File upload thiếu size/MIME validation** — `MAX_FILE_SIZE` define nhưng không dùng

### i18n (1)

20. **15+ chỗ `.toLocaleString()` thiếu `"vi-VN"` locale** trong admin/statistics, admin/medicines

### Responsive (1)

21. **Sidebar portal không có mobile menu** — không dùng được trên mobile phone

### Documentation (2)

22. **PLAN.md 105 checkboxes chưa tick** — giảng viên nghĩ chưa làm gì
23. **package.json thiếu `description`**

---

## DANH SÁCH P2 — NICE TO HAVE

### UX (12)
1. Login form thiếu email format validation client-side
2. Register form thiếu email format validation
3. patient/telemedicine tab Chat thiếu CTA tạo session
4. admin/page hoạt động gần đây luôn rỗng
5. pharmacist/page `getHistory` không có error display
6. admin/medicines CRUD qua modal chưa verify
7. doctor/page `weeklyStats`, `schedule`, `announcements` hardcode rỗng
8. doctor/ai-assistant OK (no issues)
9. patient/medical-records OK
10. admin/doctors status chỉ map ACTIVE/OFFLINE, bỏ qua LEAVE
11. admin/notifications broadcast thiếu roles.length check
12. receptionist/billing export blob handling

### TypeScript (2)
13. 525 `: any` / `as any` casts
14. 15+ optional chaining 3+ levels

### Security (4)
15. Password policy không nhất quán (register 6 chars vs validators.ts 8+ chars)
16. AI chat không có rate limit cứng (chỉ disable button)
17. Refresh token race condition khi nhiều request cùng 401
18. `formatMd()` dùng custom sanitization thay vì DOMPurify

### A11y (3)
19. 6 pages thiếu `<h1>` (bắt đầu h2/h3)
20. Icon-only buttons thiếu aria-label (~50-80 chỗ)
21. Dropdown không keyboard navigation

### Others (3)
22. AuthContext có `@deprecated` field cần cleanup
23. `.env.example` thiếu `NEXT_PUBLIC_WS_URL`, URL sai port (5000 thay vì 3000)
24. 10/34 services không có JSDoc

---

## THỨ TỰ FIX ĐỀ XUẤT

### Đợt 1 — P0 Critical Blockers (6-8h)

**Nhóm 1: Dead buttons + Mock hardcode (2h)**
- Fix booking catch fallback
- Wire nút "Đánh giá" patient/appointments
- Replace `simulateLabResults` bằng API call hoặc disable feature
- Xóa hardcode chat messages telemedicine
- Fix `usePageAIContext` hardcode patientId
- Wire nút "Thêm cơ sở mới" admin/hospitals
- Wire pharmacist/inventory request modal
- Wire receptionist/queue handleTransfer

**Nhóm 2: useEffect deps (1.5h)**
- Sửa 41 `useEffect` thiếu `[]` — wrap agent để sửa auto

**Nhóm 3: Hydration issues (0.5h)**
- Sửa 2 `new Date()` trong JSX dùng useState

**Nhóm 4: Accessibility minimum (2-3h)**
- Thêm `role="dialog"`, `aria-modal` vào 2 modal components
- Thêm `aria-label` cho form inputs trong 10 file quan trọng nhất

**Nhóm 5: Placeholder pages (1h)**
- patient/profile Tab "Lịch sử"/"Kết quả": wire API hoặc remove tabs
- pharmacist drug interaction: disable hoặc remove card

### Đợt 2 — P1 High Priority (4-5h)

- Fix 18 UX issues theo danh sách
- Fix file upload size validation
- Fix 15+ toLocaleString missing locale
- Add mobile sidebar portal
- Update PLAN.md tick checkboxes
- Add package.json description

### Đợt 3 — P2 Optional (tùy thời gian)

- Improve TypeScript types (giảm `any`)
- Add DOMPurify thay formatMd custom
- Password policy consistency
- JSDoc cho services
- Update .env.example

---

## BUILD STATUS

✅ **`npm run build` SUCCESS** — 0 errors, 79 static pages, bundle sizes OK
✅ **`npx tsc --noEmit` = 0 errors**
✅ **Security: 0 critical vulnerabilities**

## READY FOR SUBMISSION?

**Gần sẵn sàng, nhưng cần fix P0 trước:**
- Core flows hoạt động (login, register, booking, examination, prescription, billing, dispensing)
- Build pass, TypeScript clean
- Security tốt, không có lỗ hổng nghiêm trọng
- Documentation 7.5/10

**Vấn đề chặn demo:**
- Một số feature có placeholder/dead buttons có thể bị giảng viên hỏi
- Mobile responsive chưa hoàn chỉnh cho portal sidebar
- Accessibility chưa đạt chuẩn (nhưng không ảnh hưởng demo desktop)
