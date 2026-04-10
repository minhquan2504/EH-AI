# EHealth Website — TODO / Danh sách việc cần làm

> Cập nhật: 2026-03-24 (session 3)
> Backend Swagger: `http://160.250.186.97:3000/api-docs`
> Tổng endpoints thực tế trên server: **~350 paths**

---

## 🔴 CRITICAL — Trang dùng sai endpoint (API sai URL)

Các trang sau đang gọi URL không tồn tại trên server → **luôn fallback về mock data** dù đã login.

| # | Trang | Vấn đề | Fix cần làm |
|---|-------|---------|-------------|
| 1 | `portal/doctor/examination` | ✅ **XONG** — `EMR_ENDPOINTS` đã sửa → `/api/encounters` | — |
| 2 | `portal/doctor/telemedicine` | ✅ **XONG** — đã sửa → `/api/teleconsultation/booking` | — |
| 3 | `admin/schedules` | ✅ **XONG** — đã sửa → `/api/staff-schedules` | — |
| 4 | `portal/pharmacist/prescriptions` | ✅ **XONG** — dùng `prescriptionService.search()` → `/api/prescriptions/search` | — |
| 5 | `portal/doctor/medical-records` | ✅ **XONG** — `EMR_ENDPOINTS.LIST` = `/api/encounters` | — |

---

## 🟠 HIGH — Trang chưa wire API (100% mock data)

### Admin Portal

| # | Trang | Service cần dùng | API endpoint |
|---|-------|-----------------|--------------|
| 6 | `admin/medicines/inventory` | ✅ **XONG** — `inventoryService.getList()` + `getLowStock()` + `getStockInList()` | — |
| 7 | `admin/medicines/stock` | ✅ **XONG** — `inventoryService.getList()` | — |
| 8 | `admin/statistics/revenue` | `reportService.getRevenue()` | `GET /api/reports/revenue` |
| 9 | `admin/users/roles` | `permissionService.getRoles()` | `GET /api/roles` |
| 10 | `admin/hospitals/time-slots` | `systemConfigService.getWorkingHours()` | `GET /api/system/working-hours` |
| 11 | `admin/medicines/new` | `medicineService.createDrug()` | `POST /api/pharmacy/drugs` |
| 12 | `admin/medicines/import` | `medicineService.importDrugs()` | `POST /api/pharmacy/drugs/import` |
| 13 | `admin/medicines/export` | `medicineService.exportDrugs()` | `GET /api/pharmacy/drugs/export` |
| 14 | `admin/doctors/[id]` | `staffService.getById()` | `GET /api/staff/{staffId}` |
| 15 | `admin/doctors/new` | `staffService.create()` | `POST /api/staff` |
| 16 | `admin/users/new` | `userService.createUser()` | `POST /api/users` |
| 17 | `admin/users/[id]/edit` | `userService.updateUser()` | `PUT /api/users/{id}` |
| 18 | `admin/departments/new` | `departmentService.createDepartment()` | `POST /api/departments` |

### Doctor Portal

| # | Trang | Service cần dùng | API endpoint |
|---|-------|-----------------|--------------|
| 19 | `portal/doctor/prescriptions` | ✅ **XONG** — `prescriptionService.getByDoctor(user.id)` | — |
| 20 | `portal/doctor/prescriptions/new` | `encounterService.createPrescription()` | `POST /api/prescriptions/{encounterId}` |
| 21 | `portal/doctor/appointments/manage-slots` | `scheduleService` | `GET /api/staff-schedules` |
| 22 | `portal/doctor/appointments/new` | `appointmentService.createAppointment()` | `POST /api/appointments` |
| 23 | `portal/doctor/settings` | `axiosClient` → `PROFILE_ENDPOINTS.ME` | `GET/PUT /api/profile/me` ✅ (đã làm nhưng cần verify) |

### Receptionist Portal

| # | Trang | Service cần dùng | API endpoint |
|---|-------|-----------------|--------------|
| 24 | `portal/receptionist/reception` | ✅ **XONG** — patient search + create patient + create appointment thật | — |
| 25 | `portal/receptionist/queue` | ✅ **XONG** — `appointmentStatusService.getQueueToday()` với fallback | — |
| 26 | `portal/receptionist/billing/new` | `billingService.createInvoice()` | `POST /api/billing/invoices` |
| 27 | `portal/receptionist/patients/[id]` | `patientService.getPatientById()` | `GET /api/patients/{id}` |
| 28 | `portal/receptionist/patients/new` | `patientService.createPatient()` | `POST /api/patients` |
| 29 | `portal/receptionist/appointments/new` | `appointmentService.createAppointment()` | `POST /api/appointments/book-by-staff` |
| 30 | `portal/receptionist/settings` | ✅ **XONG** — load/save qua `PROFILE_ENDPOINTS.ME` | — |

### Pharmacist Portal

| # | Trang | Service cần dùng | API endpoint |
|---|-------|-----------------|--------------|
| 31 | `portal/pharmacist/inventory` | ✅ **XONG** — `inventoryService.getList()` ưu tiên, fallback `getDrugs()` | — |
| 32 | `portal/pharmacist/inventory/import` | `medicineService.importDrugs()` | `POST /api/pharmacy/drugs/import` |
| 33 | `portal/pharmacist/settings` | ✅ **XONG** — load/save qua `PROFILE_ENDPOINTS.ME` | — |

---

## 🟡 MEDIUM — Trang cần tạo mới (UI chưa có, API đã sẵn)

### Admin — Quản lý cơ sở

| # | Trang mới | Route | API chính |
|---|-----------|-------|-----------|
| 34 | Quản lý chi nhánh | `/admin/branches` | `GET/POST /api/branches` |
| 35 | Quản lý phòng khám | `/admin/rooms` | `GET /api/medical-rooms` |
| 36 | Quản lý giường bệnh | `/admin/beds` | `GET /api/beds` |
| 37 | Ca làm việc | `/admin/shifts` | `GET /api/shifts` |
| 38 | Nghỉ phép nhân sự | `/admin/leaves` | `GET /api/leaves` |
| 39 | Giấy phép hành nghề | `/admin/licenses` | `GET /api/licenses` |
| 40 | Nhà cung cấp | `/admin/suppliers` | `GET /api/suppliers` |
| 41 | Kho dược | `/admin/warehouses` | `GET /api/warehouses` |

### Doctor Portal — Lâm sàng

| # | Trang mới | Route | API chính |
|---|-----------|-------|-----------|
| 42 | Hồ sơ sức khỏe bệnh nhân (EHR) | `/portal/doctor/patients/[id]/ehr` | `GET /api/ehr/patients/{id}/health-summary` |
| 43 | Ký duyệt hồ sơ | `/portal/doctor/sign-off` | `GET /api/sign-off/by-doctor/pending` |
| 44 | Chỉ định xét nghiệm | `/portal/doctor/medical-orders` | `GET /api/medical-orders/{encounterId}` |
| 45 | Vắng mặt bác sĩ | `/portal/doctor/absences` | `GET /api/doctor-absences` |
| 46 | Kế hoạch điều trị | `/portal/doctor/treatment-plans` | `GET /api/treatment-plans/by-patient/{id}` |

### Receptionist Portal — Tiếp đón

| # | Trang mới | Route | API chính |
|---|-----------|-------|-----------|
| 47 | Bảo hiểm bệnh nhân | `/portal/receptionist/insurance` | `GET /api/patient-insurances` |
| 48 | Check-in QR | `/portal/receptionist/checkin` | `POST /api/appointment-status/{id}/check-in` |
| 49 | Thanh toán trực tuyến | `/portal/receptionist/billing/online` | `POST /api/billing/payments` |
| 50 | Hoàn tiền | `/portal/receptionist/billing/refunds` | `GET /api/billing/refunds/requests` |

### Pharmacist Portal — Dược

| # | Trang mới | Route | API chính |
|---|-----------|-------|-----------|
| 51 | Nhập kho | `/portal/pharmacist/stock-in` | `GET /api/stock-in` |
| 52 | Xuất kho | `/portal/pharmacist/stock-out` | `GET /api/stock-out` |
| 53 | Nhà cung cấp | `/portal/pharmacist/suppliers` | `GET /api/suppliers` |
| 54 | Cảnh báo tồn kho | `/portal/pharmacist/inventory/alerts` | `GET /api/inventory/alerts/low-stock` |

### Teleconsultation (Khám trực tuyến)

| # | Trang mới | Route | API chính |
|---|-----------|-------|-----------|
| 55 | Đặt lịch khám online | `/portal/doctor/telemedicine/book` | `POST /api/teleconsultation/booking` |
| 56 | Phòng khám video | `/portal/doctor/telemedicine/room/[id]` | `POST /api/teleconsultation/room/{id}/join` |
| 57 | Chat y tế | `/portal/doctor/telemedicine/chat` | `GET /api/teleconsultation/medical-chat/conversations` |
| 58 | Follow-up sau khám | `/portal/doctor/telemedicine/follow-ups` | `GET /api/teleconsultation/follow-ups/plans` |

---

## 🔵 LOW — Cải thiện UI (trang đã có, cần nâng cấp)

| # | Trang | Cần thêm |
|---|-------|---------|
| 59 | `portal/doctor/examination` | Tích hợp search ICD-10 (`GET /api/diagnoses/search-icd`) |
| 60 | `portal/doctor/examination` | Nút "Tạo encounter từ lịch hẹn" (`POST /api/encounters/from-appointment/{id}`) |
| 61 | `portal/doctor/examination` | Chỉ định xét nghiệm realtime (`POST /api/medical-orders/{encounterId}`) |
| 62 | `portal/doctor/examination` | Ký duyệt hồ sơ (`POST /api/sign-off/{id}/official-sign`) |
| 63 | `portal/receptionist/queue` | Nút check-in QR (`POST /api/appointment-status/{id}/check-in`) |
| 64 | `portal/receptionist/queue` | Nút "Bỏ qua" / "Gọi lại" (`/api/appointment-status/{id}/skip` + `/recall`) |
| 65 | `portal/receptionist/billing` | Hiển thị trạng thái thanh toán từ `GET /api/billing/payments/by-invoice/{id}` |
| 66 | `portal/pharmacist/dispensing` | Kiểm tra tồn kho trước khi cấp (`GET /api/dispensing/inventory/{drugId}/check`) |
| 67 | `portal/pharmacist/prescriptions` | Filter theo trạng thái (`PRESCRIBED`, `DISPENSED`, `CANCELLED`) |
| 68 | `admin/doctors` | Xem lịch trực của bác sĩ (`GET /api/staff-schedules/staff/{staffId}`) |
| 69 | `admin/statistics` | Thêm biểu đồ doanh thu từ `GET /api/reports/revenue` |
| 70 | `admin/departments` | Thêm danh sách bác sĩ trong khoa (`GET /api/staff?role=DOCTOR&departmentId=...`) |
| 71 | `notifications/inbox` | Real-time badge count (WebSocket hoặc polling `/api/notifications/inbox`) |
| 72 | Tất cả trang list | Thêm phân trang thực sự (hiện đang load tất cả `limit: 200`) |
| 73 | Login page | Thêm đăng nhập bằng SĐT (`POST /api/auth/login/phone`) |
| 74 | `admin/users` | Import/Export hàng loạt (`POST /api/users/import`, `GET /api/users/export`) |

---

## 📦 Service Files — Trạng thái

| Service | File | Endpoint chính | Wired vào trang |
|---------|------|---------------|-----------------|
| authService | ✅ | `/api/auth/*` | login page |
| userService | ✅ | `/api/users/*` | admin/users |
| staffService | ✅ | `/api/staff` | admin/doctors |
| patientService | ✅ | `/api/patients/*` | receptionist/patients |
| appointmentService | ✅ | `/api/appointments/*` | doctor/appointments |
| appointmentStatusService | ✅ | `/api/appointment-status/*` | doctor/queue ✅, receptionist/queue ❌ |
| encounterService | ✅ | `/api/encounters/*` | ❌ chưa wire vào trang nào |
| emrService | ⚠️ URL sai | `/api/emr` (không tồn tại) | doctor/examination |
| prescriptionService | ⚠️ URL sai | `/api/prescriptions` (sai) | pharmacist/prescriptions |
| dispensingService | ✅ | `/api/dispensing/*` | pharmacist/dispensing |
| billingService | ⚠️ URL sai | `/api/billing/invoices/{id}/pay` (sai) | receptionist/billing |
| medicineService | ✅ | `/api/pharmacy/drugs/*` | admin/medicines, pharmacist/inventory |
| inventoryService | ✅ | `/api/inventory/*` | ❌ chưa wire vào trang nào |
| departmentService | ✅ | `/api/departments/*` | admin/departments |
| scheduleService | ✅ (fixed) | `/api/staff-schedules/*` | admin/schedules |
| notificationService | ✅ | `/api/notifications/*` | admin/notifications, /notifications/inbox |
| reportService | ✅ | `/api/reports/*` | admin/statistics |
| auditService | ✅ | `/api/system/audit-logs/*` | admin/activity-logs |
| systemConfigService | ✅ | `/api/system/*` | (dùng trực tiếp) |
| specialtyService | ✅ | `/api/specialties/*` | (dropdown) |
| permissionService | ✅ | `/api/roles/*` `/api/permissions/*` | admin/users/roles |
| ehrService | ✅ (fixed) | `/api/ehr/patients/*` | (chưa wire) |
| aiService | ✅ | `/api/ai/*` | doctor/ai-assistant |
| telemedicineService | ✅ (fixed) | `/api/teleconsultation/*` | doctor/telemedicine |
| facilityService | ✅ | `/api/facilities/*` | admin/hospitals |
| doctorService | ⚠️ | `/api/doctors` (có thể sai) | (replaced by staffService) |

---

## 🗂️ Nhóm API chưa có service hoặc trang

| Nhóm API | Endpoint mẫu | Ưu tiên |
|----------|-------------|---------|
| Teleconsultation room | `/api/teleconsultation/room/{id}/join` | HIGH |
| Medical orders (xét nghiệm) | `/api/medical-orders/{encounterId}` | HIGH |
| Sign-off (ký duyệt) | `/api/sign-off/by-doctor/pending` | HIGH |
| Appointment confirmations | `/api/appointment-confirmations/{id}/confirm` | MEDIUM |
| Appointment coordination (AI) | `/api/appointment-coordination/suggest-slots` | MEDIUM |
| Patient insurances | `/api/patient-insurances` | MEDIUM |
| Insurance providers | `/api/insurance-providers` | MEDIUM |
| Treatment plans | `/api/treatment-plans/*` | MEDIUM |
| Billing payments (online) | `/api/billing/payments` | MEDIUM |
| Billing pricing policies | `/api/billing/pricing/policies` | LOW |
| Billing refunds | `/api/billing/refunds/requests` | MEDIUM |
| Billing cashier auth | `/api/billing/cashier-auth/*` | LOW |
| Billing e-invoices | `/api/billing/documents/e-invoices` | LOW |
| Branches | `/api/branches` | LOW |
| Medical rooms | `/api/medical-rooms` | LOW |
| Beds | `/api/beds` | LOW |
| Shifts | `/api/shifts` | LOW |
| Leaves | `/api/leaves` | LOW |
| Licenses | `/api/licenses` | LOW |
| Suppliers | `/api/suppliers` | LOW |
| Warehouses | `/api/warehouses` | LOW |
| Doctor availability | `/api/doctor-availability/{doctorId}` | MEDIUM |
| Doctor absences | `/api/doctor-absences` | LOW |
| Patient documents | `/api/patient-documents` | MEDIUM |
| Patient relations | `/api/patient-relations` | LOW |
| Patient tags | `/api/patient-tags` | LOW |
| Relation types | `/api/relation-types` | LOW |
| Operating hours | `/api/operating-hours` | LOW |
| Closed days | `/api/closed-days` | LOW |
| Holidays | `/api/holidays` | LOW |
| Equipment | `/api/equipments` | LOW |
| Teleconsultation follow-ups | `/api/teleconsultation/follow-ups/*` | MEDIUM |
| Teleconsultation medical chat | `/api/teleconsultation/medical-chat/*` | MEDIUM |
| Teleconsultation quality | `/api/teleconsultation/quality/*` | LOW |
| Master data categories | `/api/master-data/categories` | LOW |
| Medical services | `/api/medical-services/master` | LOW |
| Specialty services | `/api/specialty-services/*` | LOW |
| Booking configs | `/api/booking-configs/*` | LOW |

---

## ✅ Đã hoàn thành

- [x] Login page — dùng `authService.login()` thực
- [x] Admin/users — CRUD với `userService`
- [x] Admin/departments — CRUD với `departmentService`
- [x] Admin/doctors — list với `staffService.getList({ role: 'DOCTOR' })`
- [x] Admin/hospitals — list với `facilityService`
- [x] Admin/medicines — list/create với `medicineService`
- [x] Admin/schedules — list với `scheduleService` (→ `/api/staff-schedules`)
- [x] Admin/settings — profile với `PROFILE_ENDPOINTS.ME`
- [x] Admin/statistics — dashboard với `reportService`
- [x] Admin/activity-logs — list với `auditService`
- [x] Admin/notifications — CRUD với `notificationService`
- [x] Doctor/dashboard — stats với `appointmentService`
- [x] Doctor/appointments — list với `appointmentService`
- [x] Doctor/queue — list với `appointmentStatusService` + fallback
- [x] Doctor/medical-records — list với `emrService` (cần đổi sang `encounterService`)
- [x] Doctor/settings — profile với `PROFILE_ENDPOINTS.ME`
- [x] Doctor/ai-assistant — chat với `aiService`
- [x] Doctor/telemedicine — list với `telemedicineService` (→ `/api/teleconsultation`)
- [x] Receptionist/dashboard — stats với `appointmentService` + `patientService`
- [x] Receptionist/patients — CRUD với `patientService`
- [x] Receptionist/appointments — list với `appointmentService`
- [x] Receptionist/billing — list với `billingService`
- [x] Pharmacist/dashboard — stats với `prescriptionService` + `medicineService`
- [x] Pharmacist/prescriptions — list với `prescriptionService`
- [x] Pharmacist/dispensing — cấp phát với `dispensingService` (→ `/api/dispensing`)
- [x] Pharmacist/inventory — list với `medicineService`
- [x] Notifications/inbox — inbox với `notificationService`
- [x] `endpoints.ts` — Cập nhật đầy đủ ~40 nhóm endpoint theo Swagger thực tế
- [x] `STAFF_ENDPOINTS` — `/api/staff` thêm mới
- [x] `ENCOUNTER_ENDPOINTS` — `/api/encounters/*`
- [x] `CLINICAL_EXAM_ENDPOINTS` — `/api/clinical-examinations/*`
- [x] `DIAGNOSIS_ENDPOINTS` — `/api/diagnoses/*`
- [x] `MEDICAL_ORDER_ENDPOINTS` — `/api/medical-orders/*`
- [x] `MEDICAL_RECORD_ENDPOINTS` — `/api/medical-records/*`
- [x] `DISPENSING_ENDPOINTS` — `/api/dispensing/*`
- [x] `INVENTORY_ENDPOINTS` — `/api/inventory/*`
- [x] `STOCK_IN_ENDPOINTS` / `STOCK_OUT_ENDPOINTS`
- [x] `APPOINTMENT_STATUS_ENDPOINTS` — `/api/appointment-status/*`
- [x] `APPOINTMENT_CONFIRMATION_ENDPOINTS`
- [x] `BRANCH_ENDPOINTS` / `MEDICAL_ROOM_ENDPOINTS`
- [x] `PATIENT_INSURANCE_ENDPOINTS`
- [x] `LEAVE_ENDPOINTS` / `WAREHOUSE_ENDPOINTS` / `SUPPLIER_ENDPOINTS`
- [x] `TREATMENT_PLAN_ENDPOINTS` / `SIGN_OFF_ENDPOINTS`
- [x] Fix `TELEMEDICINE_ENDPOINTS` → `/api/teleconsultation/*`
- [x] Fix `EMR_ENDPOINTS` → `/api/encounters` + `/api/medical-records`
- [x] Fix `EHR_ENDPOINTS` → `/api/ehr/patients/{id}/...`
- [x] Fix `SCHEDULE_ENDPOINTS` → `/api/staff-schedules`
- [x] Fix `BILLING_ENDPOINTS.PAY` → `/api/billing/offline/pay`
- [x] Fix `PRESCRIPTION_ENDPOINTS.DISPENSE` → `/api/dispensing/{id}`
