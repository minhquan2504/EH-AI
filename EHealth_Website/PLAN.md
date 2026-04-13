# KẾ HOẠCH TÍCH HỢP API — EHealth Frontend ↔ EHealth-Api

> **Mục tiêu**: Thay thế 100% mock data bằng API thật, hoàn thiện website production-ready cho đồ án tốt nghiệp.
>
> **Cập nhật**: 2026-04-13
>
> **Scope**: 88 pages, 1,010 BE endpoints, 270 FE endpoint declarations, 27 service files.

---

## TÌNH TRẠNG HIỆN TẠI

### Backend EHealth-Api — SẴN SÀNG 100%
| Module | Endpoints | Status |
|--------|-----------|--------|
| Core (Auth, Users, Roles, Permissions, System) | 156 | ✓ |
| Patient Management | 91 | ✓ |
| Appointment Management | 75 | ✓ |
| EMR (Encounters, Diagnoses, Prescriptions, Sign-off) | 86 | ✓ |
| EHR (Health Profile, Vital Signs, Timeline) | 71 | ✓ |
| Medication Management (Drugs, Inventory, Dispensing) | 59 | ✓ |
| Facility Management (Staff, Rooms, Equipment) | 164 | ✓ |
| Billing & Payments (SePay) | 165 | ✓ |
| Remote Consultation (Telemedicine) | 131 | ✓ |
| AI Health Chat (Gemini + RAG) | 12 | ✓ |
| **TỔNG** | **1,010** | **✓** |

**Base URL**: `http://160.250.186.97:3000` — Swagger: `/api-docs`

### Frontend EHealth_Website — ĐANG DÙNG ~27% BE
| Thống kê | Số lượng |
|----------|----------|
| Tổng pages | 88 |
| Service files | 27 |
| Endpoints declared | ~270 |
| Pages 100% mock | 5 |
| Pages mix (API + fallback mock) | 60+ |
| Pages API only | 15+ |

---

## CHIẾN LƯỢC TRIỂN KHAI

### Nguyên tắc
1. **Không rewrite tất cả cùng lúc** — chia thành 12 phases, mỗi phase 1-3 ngày
2. **Test ngay sau mỗi phase** — không gộp nhiều module trong 1 commit
3. **Giữ fallback mock tạm thời** cho trang phức tạp — xóa sau khi API ổn định
4. **Mỗi phase có checklist rõ ràng** — để biết chính xác đã xong cái gì
5. **Ưu tiên theo luồng nghiệp vụ y tế**: Auth → Patient → Appointment → Encounter → Prescription → Billing

### Quy ước commit
- `feat(api): integrate {module}` — Tích hợp API mới
- `fix(api): handle {issue}` — Fix lỗi tích hợp
- `chore(mock): remove {file}` — Xóa mock data
- Mỗi phase kết thúc với 1 commit gộp hoặc vài commit nhỏ

---

## PHASE 0 — KHỞI ĐỘNG & VERIFY (1 ngày)

### Checklist
- [x] Verify BE đang chạy: `curl http://160.250.186.97:3000/api-docs` hoặc start local
- [x] Kiểm tra Swagger có đủ endpoints: mở `/api-docs`
- [x] Tạo tài khoản test cho mỗi role qua Postman hoặc seed DB:
  - `admin@test.local` / `Admin@123` — role ADMIN
  - `doctor@test.local` / `Doctor@123` — role DOCTOR
  - `nurse@test.local` / `Nurse@123` — role NURSE
  - `staff@test.local` / `Staff@123` — role STAFF (receptionist/cashier)
  - `pharmacist@test.local` / `Pharma@123` — role (mapping từ STAFF hoặc tạo mới)
  - `patient@test.local` / `Patient@123` — role PATIENT
- [x] Verify login flow + refresh token hoạt động
- [x] Kiểm tra AxiosClient handle 401 + refresh đúng
- [x] Cập nhật `.env.local` với `NEXT_PUBLIC_API_URL`

### Files liên quan
- [axiosClient.ts](src/api/axiosClient.ts)
- [endpoints.ts](src/api/endpoints.ts)
- [authService.ts](src/services/authService.ts)

---

## PHASE 1 — AUTH & PROFILE (1-2 ngày) [P0]

### Mục tiêu
Hoàn thiện flow đăng nhập/đăng ký/đổi mật khẩu/quản lý session.

### Endpoints cần tích hợp
| Method | Endpoint | Service |
|--------|----------|---------|
| POST | `/api/auth/login/email` | authService.login |
| POST | `/api/auth/login/phone` | authService.loginPhone |
| POST | `/api/auth/register/email` | authService.register |
| POST | `/api/auth/register/phone` | authService.registerPhone |
| POST | `/api/auth/verify-email` | authService.verifyEmail |
| POST | `/api/auth/forgot-password` | authService.forgotPassword |
| POST | `/api/auth/reset-password` | authService.resetPassword |
| POST | `/api/auth/refresh-token` | axiosClient (interceptor) |
| POST | `/api/auth/logout` | authService.logout |
| GET | `/api/auth/me/roles` | authService.getMyRoles |
| GET | `/api/auth/me/menus` | authService.getMyMenus |
| GET | `/api/auth/me/permissions` | authService.getMyPermissions |
| GET | `/api/auth/sessions` | profileService.getSessions |
| DELETE | `/api/auth/sessions/:id` | profileService.revokeSession |
| GET | `/api/profile/me` | profileService.getMe |
| PUT | `/api/profile/me` | profileService.updateMe |
| PUT | `/api/profile/password` | profileService.changePassword |

### Pages cần sửa
- [x] [/login](src/app/login/page.tsx)
- [x] [/register](src/app/register/page.tsx)
- [x] [/forgot-password](src/app/forgot-password/page.tsx)
- [x] [/verify-email](src/app/verify-email/page.tsx)
- [x] [/otp](src/app/otp/page.tsx) — đăng nhập/đăng ký phone
- [x] [/patient/profile](src/app/patient/profile/page.tsx) — thay mock
- [x] [AuthContext.tsx](src/contexts/AuthContext.tsx) — lưu roles[] array
- [x] [AuthGuard.tsx](src/components/common/AuthGuard.tsx) — check roles[] array

### Tiêu chí hoàn thành
- Login thành công với mọi role, redirect đúng trang
- Refresh token tự động khi hết hạn
- Logout xóa token + redirect login
- Role được lưu chính xác (ADMIN, DOCTOR, STAFF, NURSE, PATIENT)
- Quản lý sessions (xem, thu hồi)

---

## PHASE 2 — ADMIN USER MANAGEMENT (2 ngày) [P0]

### Endpoints
`/api/users` (14 endpoints) + `/api/roles` (10) + `/api/permissions` (5) + `/api/modules` + `/api/menus` + `/api/api-permissions`

### Pages
- [x] [/admin/users](src/app/admin/users/page.tsx)
- [x] [/admin/users/new](src/app/admin/users/new/page.tsx)
- [x] [/admin/users/[id]](src/app/admin/users/[id]/page.tsx)
- [x] [/admin/users/[id]/edit](src/app/admin/users/[id]/edit/page.tsx)
- [x] [/admin/users/roles](src/app/admin/users/roles/page.tsx)
- [x] [/admin/users/roles/new](src/app/admin/users/roles/new/page.tsx)

### Việc cụ thể
- Thay `MOCK_USERS`, `MOCK_ROLES` bằng API
- CRUD người dùng + gán vai trò + gán cơ sở
- Import/Export Excel qua `/api/users/import` và `/api/users/export`
- Lock/Unlock account
- Reset password
- Bỏ fallback mock nếu API trả về data

---

## PHASE 3 — FACILITY MANAGEMENT (3 ngày) [P0]

### Submodules
1. **Facility & Branch** — `/api/facilities`, `/api/branches`
2. **Department & Specialty** — `/api/departments`, `/api/specialties`, `/api/department-specialties`
3. **Medical Rooms & Beds** — `/api/medical-rooms`, `/api/beds`, `/api/room-maintenance`
4. **Staff** — `/api/staff` (bao gồm cả doctors)
5. **Shifts & Schedules** — `/api/shifts`, `/api/staff-schedules`, `/api/leaves`
6. **Medical Services** — `/api/medical-services/*`
7. **Operating Hours** — `/api/operating-hours`, `/api/holidays`, `/api/closed-days`
8. **Equipment** — `/api/equipments`

### Services cần tạo mới
- [x] [branchService.ts](src/services/branchService.ts) — MỚI
- [x] [leaveService.ts](src/services/leaveService.ts) — MỚI
- [x] [roomService.ts](src/services/roomService.ts) — MỚI hoặc mở rộng
- [x] [equipmentService.ts](src/services/equipmentService.ts) — MỚI
- [x] [shiftService.ts](src/services/shiftService.ts) — MỚI
- [x] [holidayService.ts](src/services/holidayService.ts) — MỚI
- [x] Mở rộng [staffService.ts](src/services/staffService.ts) để dùng thực sự

### Pages
- [x] [/admin/doctors](src/app/admin/doctors/page.tsx) — thay MOCK_DOCTORS
- [x] [/admin/doctors/new](src/app/admin/doctors/new/page.tsx)
- [x] [/admin/doctors/[id]](src/app/admin/doctors/[id]/page.tsx)
- [x] [/admin/doctors/[id]/edit](src/app/admin/doctors/[id]/edit/page.tsx)
- [x] [/admin/departments](src/app/admin/departments/page.tsx)
- [x] [/admin/departments/new](src/app/admin/departments/new/page.tsx)
- [x] [/admin/departments/[id]](src/app/admin/departments/[id]/page.tsx)
- [x] [/admin/schedules](src/app/admin/schedules/page.tsx)
- [x] [/admin/schedules/new](src/app/admin/schedules/new/page.tsx)
- [x] [/admin/hospitals](src/app/admin/hospitals/page.tsx)
- [x] [/admin/hospitals/time-slots](src/app/admin/hospitals/time-slots/page.tsx)
- [x] [/(public)/doctors](src/app/(public)/doctors/page.tsx) — thay 100% mock
- [x] [/(public)/doctors/[id]](src/app/(public)/doctors/[id]/page.tsx)
- [x] [/(public)/specialties](src/app/(public)/specialties/page.tsx)

---

## PHASE 4 — PATIENT MANAGEMENT (3 ngày) [P0]

### Submodules
1. **Patients** — `/api/patients` (31 endpoints: CRUD, search, filter)
2. **Patient Insurances** — `/api/patient-insurances`, `/api/insurance-providers`, `/api/insurance-coverage`
3. **Patient Contacts** — `/api/patient-contact`, `/api/relation-types`, `/api/patient-relations`
4. **Patient Documents** — `/api/patient-documents`, `/api/document-types`
5. **Patient Tags** — `/api/patient-tags`, `/api/patient-classification-rules`
6. **Medical History** — `/api/medical-history`

### Services cần tạo
- [x] [documentService.ts](src/services/documentService.ts) — MỚI (DOCUMENT_ENDPOINTS)
- [x] [patientInsuranceService.ts](src/services/patientInsuranceService.ts) — MỚI
- [x] [patientRelationService.ts](src/services/patientRelationService.ts) — MỚI hoặc mở rộng

### Pages
- [x] [/portal/receptionist/patients](src/app/portal/receptionist/patients/page.tsx)
- [x] [/portal/receptionist/patients/new](src/app/portal/receptionist/patients/new/page.tsx)
- [x] [/portal/receptionist/patients/[id]](src/app/portal/receptionist/patients/[id]/page.tsx)
- [x] [/patient/patient-profiles](src/app/patient/patient-profiles/page.tsx) — kết nối API vào 5 tabs (info, contact, insurance, history, docs)

### Đặc biệt
- Trang chi tiết hồ sơ bệnh nhân (đã làm UI) cần wire lên:
  - Tab "Liên hệ" → `GET /api/patients/:id/contacts`
  - Tab "Bảo hiểm" → `GET /api/patient-insurances?patientId=:id`
  - Tab "Lịch sử khám" → `GET /api/medical-history?patientId=:id`
  - Tab "Tài liệu" → `GET /api/patient-documents?patientId=:id`

---

## PHASE 5 — APPOINTMENT (3 ngày) [P0]

### Endpoints
- `/api/appointments` (17) — CRUD, status
- `/api/appointment-status` (15) — check-in, complete, no-show
- `/api/appointment-confirmations` (8)
- `/api/appointment-coordination` (7) — AI gợi ý slot
- `/api/doctor-availability` (5)
- `/api/doctor-absences` (4)
- `/api/appointment-slots` (5)
- `/api/locked-slots` (5)
- `/api/appointment-changes` (5)

### Pages
- [x] [/(public)/booking](src/app/(public)/booking/page.tsx) — 100% mock hiện tại
- [x] [/patient/appointments](src/app/patient/appointments/page.tsx)
- [x] [/patient/appointments/[id]](src/app/patient/appointments/[id]/page.tsx)
- [x] [/portal/receptionist/appointments](src/app/portal/receptionist/appointments/page.tsx)
- [x] [/portal/receptionist/appointments/new](src/app/portal/receptionist/appointments/new/page.tsx)
- [x] [/portal/receptionist/reception](src/app/portal/receptionist/reception/page.tsx)
- [x] [/portal/receptionist/queue](src/app/portal/receptionist/queue/page.tsx)
- [x] [/portal/doctor/appointments](src/app/portal/doctor/appointments/page.tsx)
- [x] [/portal/doctor/appointments/new](src/app/portal/doctor/appointments/new/page.tsx)
- [x] [/portal/doctor/appointments/manage-slots](src/app/portal/doctor/appointments/manage-slots/page.tsx)
- [x] [/portal/doctor/queue](src/app/portal/doctor/queue/page.tsx)

### Flow quan trọng
1. **Booking** (Patient): chọn chuyên khoa → chọn bác sĩ → chọn slot → điền info → xác nhận
2. **Check-in** (Receptionist): tìm bệnh nhân → check in → thêm vào queue
3. **Queue** (Doctor): xem queue → gọi bệnh nhân tiếp theo → start exam

---

## PHASE 6 — EMR / KHÁM BỆNH (4 ngày) [P0]

Trung tâm nghiệp vụ — khá phức tạp vì có nhiều submodule.

### Endpoints
- `/api/encounters` (11) — tiếp nhận, mở HSBA
- `/api/clinical-examinations` (7) — khám lâm sàng, sinh hiệu
- `/api/diagnoses` (9) — ICD-10
- `/api/medical-orders` (12) — chỉ định CLS
- `/api/prescriptions` (16) — kê đơn
- `/api/medical-records` (10) — HSBA tổng hợp
- `/api/treatment-progress` (12) — tiến trình điều trị
- `/api/medical-signoff` (9) — ký số

### Pages
- [x] [/portal/doctor/examination](src/app/portal/doctor/examination/page.tsx) — **quan trọng nhất**
- [x] [/portal/doctor/prescriptions](src/app/portal/doctor/prescriptions/page.tsx)
- [x] [/portal/doctor/prescriptions/new](src/app/portal/doctor/prescriptions/new/page.tsx) — thay MOCK_PATIENTS
- [x] [/portal/doctor/medical-records](src/app/portal/doctor/medical-records/page.tsx)
- [x] [/patient/medical-records](src/app/patient/medical-records/page.tsx)

### Flow khám bệnh end-to-end
1. Doctor thấy queue → chọn bệnh nhân → Start Exam
2. `POST /api/encounters` → tạo encounter
3. `POST /api/clinical-examinations/:id/vitals` → nhập sinh hiệu
4. `POST /api/diagnoses` → chẩn đoán (search ICD-10)
5. `POST /api/medical-orders` → chỉ định xét nghiệm/chẩn đoán hình ảnh
6. `POST /api/prescriptions` → kê đơn thuốc (search drugs)
7. `POST /api/medical-signoff/:encounterId/draft-sign` → ký nháp
8. `POST /api/medical-signoff/:encounterId/official-sign` → ký chính thức
9. `PATCH /api/appointment-status/:id/complete` → hoàn tất cuộc khám

---

## PHASE 7 — PHARMACY (2 ngày) [P0]

### Endpoints
- `/api/pharmacy/drugs` (8) — CRUD thuốc
- `/api/pharmacy/categories` (7) — nhóm thuốc
- `/api/dispensing` (7) — cấp phát
- `/api/inventory` (6) — tồn kho
- `/api/stock-in` (7) — nhập kho
- `/api/stock-out` (7) — xuất kho
- `/api/warehouses` (5)
- `/api/suppliers` (4)
- `/api/medication-instructions` (8)

### Pages
- [x] [/admin/medicines](src/app/admin/medicines/page.tsx) — thay MOCK_MEDICINES
- [x] [/admin/medicines/new](src/app/admin/medicines/new/page.tsx)
- [x] [/admin/medicines/[id]](src/app/admin/medicines/[id]/page.tsx)
- [x] [/admin/medicines/stock/[id]](src/app/admin/medicines/stock/[id]/page.tsx)
- [x] [/admin/medicines/inventory](src/app/admin/medicines/inventory/page.tsx)
- [x] [/admin/medicines/inventory/import](src/app/admin/medicines/inventory/import/page.tsx)
- [x] [/admin/medicines/import/[id]](src/app/admin/medicines/import/[id]/page.tsx)
- [x] [/admin/medicines/export/[id]](src/app/admin/medicines/export/[id]/page.tsx)
- [x] [/admin/medicines/export/create](src/app/admin/medicines/export/create/page.tsx)
- [x] [/portal/pharmacist](src/app/portal/pharmacist/page.tsx)
- [x] [/portal/pharmacist/prescriptions](src/app/portal/pharmacist/prescriptions/page.tsx)
- [x] [/portal/pharmacist/dispensing](src/app/portal/pharmacist/dispensing/page.tsx)
- [x] [/portal/pharmacist/inventory](src/app/portal/pharmacist/inventory/page.tsx)
- [x] [/portal/pharmacist/inventory/import](src/app/portal/pharmacist/inventory/import/page.tsx)

---

## PHASE 8 — EHR / HỒ SƠ SỨC KHỎE BỆNH NHÂN (2 ngày) [P1]

### Endpoints
- `/api/ehr/health-profiles` (13)
- `/api/ehr/medical-history` (18)
- `/api/ehr/vital-signs` (8)
- `/api/ehr/medication-treatment` (9)
- `/api/ehr/clinical-results` (7) — kết quả xét nghiệm
- `/api/ehr/health-timeline` (6)
- `/api/ehr/data-integration` (10)

### Pages
- [x] [/patient](src/app/patient/page.tsx) — Dashboard, thay MOCK_VITAL_SIGNS
- [x] [/patient/health-records](src/app/patient/health-records/page.tsx)
- [x] [/patient/medical-records](src/app/patient/medical-records/page.tsx) — đã có 1 phần

### Việc đặc biệt
- Kết nối profile selector (đã làm) vào filter EHR theo profile
- Vital signs chart với real data
- Timeline sắp xếp theo ngày

---

## PHASE 9 — BILLING (4 ngày) [P0]

Module lớn nhất, chia thành nhiều sub-phase.

### 9.1 Pricing & Catalog (0.5 ngày)
- `/api/billing/pricing/catalog` (3 endpoints)
- `/api/billing/pricing/policies` (14 endpoints)

### 9.2 Invoices (1 ngày)
- `/api/billing/invoices` (22 endpoints)

### 9.3 Payments (1 ngày)
- `/api/billing/payments` — offline & online
- `/api/billing/offline/*` (16 endpoints) — POS, biên lai
- `/api/billing/payments/*` (12 endpoints) — SePay QR, orders
- `/api/billing/cashier-shifts` (4 endpoints)

### 9.4 Documents, Reconciliation, Refunds (1 ngày)
- `/api/billing/documents/*` (22) — HĐĐT
- `/api/billing/reconciliation/*` (18) — đối soát
- `/api/billing/refunds/*` (16) — hoàn tiền
- `/api/billing/pricing-policies/*` (22) — discount, voucher
- `/api/billing/cashier-auth/*` (20)

### 9.5 Pages (0.5 ngày)
- [x] [/portal/receptionist/billing](src/app/portal/receptionist/billing/page.tsx)
- [x] [/portal/receptionist/billing/new](src/app/portal/receptionist/billing/new/page.tsx)
- [x] [/patient/billing](src/app/patient/billing/page.tsx)
- [x] [/admin/statistics/revenue](src/app/admin/statistics/revenue/page.tsx)

### Mở rộng billingService
- Hiện tại chỉ có 12 function → cần mở rộng lên ~30 function phủ đầy đủ submodules

---

## PHASE 10 — TELEMEDICINE (3 ngày) [P1]

### Endpoints (131 total)
- `/api/teleconsultation/types` + `/configs` (16)
- `/api/teleconsultation/booking` (12)
- `/api/teleconsultation/room` (18)
- `/api/teleconsultation/medical-chat` (15)
- `/api/teleconsultation/results` (14)
- `/api/teleconsultation/prescriptions` (14)
- `/api/teleconsultation/follow-ups` (15)
- `/api/teleconsultation/quality` (14)
- `/api/teleconsultation/admin` (13)

### Pages
- [x] [/patient/telemedicine](src/app/patient/telemedicine/page.tsx)
- [x] [/portal/doctor/telemedicine](src/app/portal/doctor/telemedicine/page.tsx)

### Mở rộng telemedicineService (hiện 7 function → ~40 function)

### Lưu ý
- WebRTC/video call integration là phần riêng, có thể làm sau
- Chat messaging qua WebSocket hoặc polling
- Cần tool hỗ trợ: Jitsi/Daily.co/hoặc custom WebRTC

---

## PHASE 11 — AI CHAT + NOTIFICATIONS + MASTER DATA (2 ngày) [P1]

### AI Health Chat
- `/api/ai/health-chat/sessions` (9 endpoints, SSE streaming)
- `/api/ai/rag/documents` (3)

### Notifications
- `/api/notifications/categories` (5)
- `/api/notifications/templates` (5)
- `/api/notifications/role-configs` (5)
- `/api/notifications/inbox` (3)

### Master Data
- `/api/master-data/icd10`
- `/api/master-data/countries`
- `/api/master-data/ethnicities`

### Pages
- [x] [/patient/ai-consult](src/app/patient/ai-consult/page.tsx)
- [x] [/portal/doctor/ai-assistant](src/app/portal/doctor/ai-assistant/page.tsx)
- [x] [/admin/notifications](src/app/admin/notifications/page.tsx)
- [x] [/notifications/inbox](src/app/notifications/inbox/page.tsx)
- [x] [FloatingChatBox.tsx](src/components/shared/FloatingChatBox.tsx) — chat AI floating

### Thay thế hardcoded dropdowns bằng master data
- Dropdown quốc gia, dân tộc, mã ICD-10 trong các form

---

## PHASE 12 — CLEANUP & TESTING (2 ngày)

### Xóa mock data
- [x] Xóa [src/data/patient-mock.ts](src/data/patient-mock.ts)
- [x] Xóa [src/data/doctor.ts](src/data/doctor.ts)
- [x] Xóa [src/data/patient-portal-mock.ts](src/data/patient-portal-mock.ts)
- [x] Xóa [src/data/medical-services-mock.ts](src/data/medical-services-mock.ts)
- [x] Xóa [src/data/medication-reminders-mock.ts](src/data/medication-reminders-mock.ts)
- [x] Xóa [src/data/patient-profiles-mock.ts](src/data/patient-profiles-mock.ts)
- [x] Xóa [src/lib/mock-data/admin.ts](src/lib/mock-data/admin.ts)
- [x] Xóa [src/lib/mock-data/doctor.ts](src/lib/mock-data/doctor.ts)

### Remove fallback code
- Grep tất cả `// fallback to mock`, `|| MOCK_` và xóa
- Grep `catch { /* keep mock */ }` và xóa

### Test end-to-end mỗi role
- [x] **Patient**: login → book appointment → xem lịch → check-in → xem kết quả → thanh toán
- [x] **Doctor**: login → xem queue → khám bệnh → kê đơn → ký số → hoàn tất
- [x] **Receptionist**: login → tiếp nhận bệnh nhân → tạo lịch hẹn → check-in → tạo hóa đơn → thu tiền
- [x] **Pharmacist**: login → xem đơn thuốc → kiểm tra tồn kho → cấp phát
- [x] **Admin**: login → quản lý users/roles → xem dashboard → cấu hình hệ thống → xem báo cáo

### Remove dead code
- Console.log, TODO comments
- Unused imports
- Backup files .bak

---

## TỔNG QUAN TIMELINE

| Phase | Tên | Thời gian | Ưu tiên |
|-------|-----|-----------|---------|
| 0 | Verify & Setup | 1 ngày | P0 |
| 1 | Auth & Profile | 1-2 ngày | P0 |
| 2 | Admin User Management | 2 ngày | P0 |
| 3 | Facility Management | 3 ngày | P0 |
| 4 | Patient Management | 3 ngày | P0 |
| 5 | Appointment | 3 ngày | P0 |
| 6 | EMR / Khám bệnh | 4 ngày | P0 |
| 7 | Pharmacy | 2 ngày | P0 |
| 8 | EHR / Hồ sơ sức khỏe | 2 ngày | P1 |
| 9 | Billing | 4 ngày | P0 |
| 10 | Telemedicine | 3 ngày | P1 |
| 11 | AI + Notifications + Master Data | 2 ngày | P1 |
| 12 | Cleanup & Testing | 2 ngày | P0 |
| **TỔNG** | | **~32 ngày** | |

---

## CHIẾN LƯỢC THỰC HIỆN THỰC TẾ

### Nếu làm 1 mình, mỗi ngày 6-8h
- **Full scope**: ~6-7 tuần
- **Core only** (P0, bỏ Telemedicine + AI): ~4-5 tuần

### Cắt giảm nếu hạn gấp
Nếu đồ án tốt nghiệp cần demo trong 2 tuần:
1. **Phase 0-2** (3-4 ngày): Auth + User Management
2. **Phase 3** rút gọn (2 ngày): Chỉ facility, department, specialty, staff (bỏ shift management)
3. **Phase 4-5** (4 ngày): Patient + Appointment cơ bản
4. **Phase 6** rút gọn (3 ngày): EMR cơ bản — encounter + diagnose + prescription (bỏ sign-off phức tạp)
5. **Phase 7** (2 ngày): Pharmacy
6. **Phase 9** rút gọn (2 ngày): Chỉ invoices + payments cơ bản
7. **Phase 12** (1 ngày): Cleanup + test

**Tổng rút gọn: ~17 ngày** — demo được flow chính

### Tuyệt đối không làm nếu gấp
- Telemedicine (Phase 10) — phức tạp, cần WebRTC
- Pricing policies, vouchers, reconciliation (Phase 9 submodules)
- AI RAG upload documents
- Master data i18n

---

## RỦI RO & MITIGATION

### Rủi ro 1: Response format BE không chuẩn
Frontend hiện đang xử lý nhiều pattern fallback `res?.data?.data ?? res?.data ?? res`.
**→ Mitigation**: Tạo helper `unwrapResponse<T>()` dùng chung.

### Rủi ro 2: BE thay đổi API trong quá trình tích hợp
**→ Mitigation**: Lock Swagger version trước khi bắt đầu mỗi phase. Chat với team BE trước.

### Rủi ro 3: Dữ liệu seed không đủ
Nhiều trang cần data mẫu để test.
**→ Mitigation**: Dùng file seed trong `databases/data/` của BE hoặc tự insert qua Swagger.

### Rủi ro 4: CORS issues
**→ Mitigation**: BE đã `app.use(cors())` — nếu có vấn đề, check `.env` + origin list.

### Rủi ro 5: Role mapping không match
FE hiện có 5 roles: ADMIN, DOCTOR, PHARMACIST, STAFF, PATIENT.
BE có thể có thêm NURSE, SUPER_ADMIN, hoặc khác tên.
**→ Mitigation**: Phase 1 kiểm tra `/api/auth/me/roles` và sync role constants.

---

## GHI CHÚ KỸ THUẬT

### Response unwrap helper
Tạo file `src/api/response.ts`:
```ts
export function unwrap<T>(res: any): T {
  return res?.data?.data ?? res?.data ?? res;
}

export function unwrapList<T>(res: any): { data: T[]; pagination?: any } {
  const data = res?.data?.data ?? res?.data?.items ?? res?.data ?? [];
  const pagination = res?.data?.pagination ?? res?.pagination;
  return { data: Array.isArray(data) ? data : [], pagination };
}
```

### Service file template
```ts
import axiosClient from "@/api/axiosClient";
import { XXX_ENDPOINTS } from "@/api/endpoints";
import { unwrap, unwrapList } from "@/api/response";

export const xxxService = {
  getList: async (params?: any) => {
    const res = await axiosClient.get(XXX_ENDPOINTS.LIST, { params });
    return unwrapList(res);
  },
  getById: async (id: string) => {
    const res = await axiosClient.get(XXX_ENDPOINTS.DETAIL(id));
    return unwrap(res);
  },
  // ...
};
```

### Env variables cần thêm
```env
NEXT_PUBLIC_API_URL=http://160.250.186.97:3000
NEXT_PUBLIC_WS_URL=ws://160.250.186.97:3000
NEXT_PUBLIC_ENABLE_MOCK_FALLBACK=false
```

---

## CÁC VIỆC FE CÓ THỂ LÀM NGAY TRƯỚC KHI BẮT ĐẦU PHASE 1

Trong khi chờ BE verify hoặc nếu đang block:

1. **Tạo 6 services còn thiếu** (không phụ thuộc BE):
   - documentService.ts
   - treatmentPlanService.ts
   - leaveService.ts
   - patientInsuranceService.ts
   - branchService.ts
   - equipmentService.ts

2. **Viết response.ts helper** như trên

3. **Tạo file SHARED_TYPES.ts** với interfaces từ Swagger

4. **Refactor axiosClient** để dùng AxiosError type (tránh `catch (error: any)`)

5. **Tạo custom hooks** cho data fetching:
   - `useApi<T>(fn)` — generic
   - `useApiList<T>(fn)` — với pagination
   - `useMutation<T>(fn)` — cho POST/PUT/DELETE

---

*File này sẽ được cập nhật liên tục theo tiến độ.*
*Liên hệ team backend nếu có endpoint không work hoặc response format khác Swagger.*
