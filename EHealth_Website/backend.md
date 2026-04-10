# Yêu cầu Backend & Báo cáo vấn đề

> Ngày cập nhật: 2026-04-08 (v2 — kiểm tra toàn diện)
> Người kiểm tra: Frontend Team
> Trạng thái: Cần review và xử lý

---

## 1. TỔNG QUAN — FRONTEND ĐÃ SỬA GÌ

### 1.1 Bug "catch hiển thị thành công" — ĐÃ SỬA 18+ file
- Tất cả catch block hiển thị thông báo thành công khi API lỗi đã được sửa thành thông báo lỗi
- Các file đã sửa: prescriptions/new, patients/new, users/new, appointments/new (receptionist + doctor), billing/new, medicines/new, departments/new, schedules/new, doctors/new, roles/new, medicines/import, medicines/export, pharmacist/inventory/import, reception, dispensing, doctor/settings

### 1.2 Validation frontend — ĐÃ BỔ SUNG
- **Receptionist tiếp nhận bệnh nhân**: validate họ tên, SĐT, CCCD, BHYT, email, ngày sinh
- **Doctor kê đơn**: validate bệnh nhân, chẩn đoán, liều lượng/tần suất/thời gian mỗi thuốc
- **Doctor khám bệnh**: validate range sinh hiệu (huyết áp, nhịp tim, nhiệt độ, SpO₂, v.v.)
- **Admin tạo user**: validate chuẩn VN + gửi đầy đủ fields
- **Booking đặt lịch**: validate họ tên + SĐT + ngày không được ở quá khứ
- **Hàm mới trong `validation.ts`**: `validateBloodPressure`, `validateVitalSign`, `validateAppointmentDate`

### 1.3 Bảo mật — ĐÃ SỬA
- **XSS**: Thêm `escapeHtml()` trước khi render `dangerouslySetInnerHTML` (FloatingChatBox, AI Assistant)
- **Open Redirect**: Navbar chỉ cho phép redirect đến URL internal (bắt đầu bằng `/`)
- **Error Boundaries**: Thêm `error.tsx` cho `/`, `/admin`, `/portal`, `/patient`

### 1.4 Logic nghiệp vụ — ĐÃ SỬA
- **Dispensing**: `setCompleted(true)` chỉ khi API thành công, không còn fake success
- **Default DOB**: Bỏ fallback `"1990-01-01"` khi không nhập ngày sinh (2 file)
- **Booking**: Không cho đặt lịch ngày quá khứ

---

## 2. YÊU CẦU BACKEND — API CẦN THÊM MỚI

### 2.1 [P0] API Tìm kiếm bệnh nhân cho bác sĩ kê đơn
- **Endpoint**: `GET /api/patients/search?q={keyword}`
- **Lý do**: Trang kê đơn đang dùng `MOCK_PATIENTS` hardcode 4 bệnh nhân giả
- **Response mong muốn**:
```json
{ "data": [{ "id": "uuid", "full_name": "Nguyễn Văn A", "patient_code": "BN001", "dob": "1990-01-01" }] }
```

### 2.2 [P0] API Hàng đợi bệnh nhân cho bác sĩ
- **Endpoint**: `GET /api/encounters/active?doctorId={id}`
- **Lý do**: Trang khám bệnh đang dùng `MOCK_PATIENT_QUEUE`
- **Response cần**: id, fullName, gender, age, phone, queueNumber, reason, allergies, medicalHistory, appointmentId

### 2.3 [P1] API Nhắc nhở uống thuốc
- **CRUD**: `GET/POST/PUT/DELETE /api/medication-reminders`
- **Ghi nhận uống thuốc**: `POST /api/medication-reminders/{id}/log`
- **Lý do**: Đang dùng hoàn toàn `localStorage` + mock data

### 2.4 [P1] API Dịch vụ y tế cho booking
- **Endpoint**: `GET /api/medical-services/active`
- **Lý do**: Đang dùng `MOCK_MEDICAL_SERVICES`

### 2.5 [P1] API Hồ sơ bệnh nhân gia đình
- **Endpoint**: `GET/POST /api/patients/{patientId}/profiles`
- **Lý do**: Đang dùng `MOCK_PATIENT_PROFILES` + `localStorage`

---

## 3. YÊU CẦU BACKEND — API HIỆN CÓ CẦN CHỈNH SỬA

### 3.1 [P0] Endpoint Create User (`POST /api/users`)
- Frontend giờ gửi đầy đủ: `fullName, email, phoneNumber, role, password, gender, dateOfBirth, address, department, hospitalId, insuranceNumber, bloodType, allergies, emergencyContact, emergencyPhone`
- **Backend cần support nhận các field mới này**

### 3.2 [P0] Endpoint Create Patient (`POST /api/patients`)
- **Backend cần validate**:
  - `full_name`: bắt buộc, 2-100 ký tự, không chứa số
  - `phone_number`: bắt buộc, 10 số, đầu số VN
  - `identity_number`: 9 hoặc 12 số (nếu có)
  - `date_of_birth`: không ở tương lai (nếu có)
  - `gender`: chỉ nhận MALE/FEMALE
- **Backend cần check trùng lặp**: CCCD, email, số BHYT trước khi tạo

### 3.3 [P0] Encounter / EMR Endpoints
- `POST /api/encounters` — validate vital signs range:
  - heartRate: 30-250, temperature: 34.0-42.0, spO2: 50-100
  - respiratoryRate: 5-60, bloodPressure: format "systolic/diastolic"
- `POST /api/medical-records/{encounterId}/sign` — check quyền bác sĩ
- Kê đơn từ encounter — check encounter chưa finalize

### 3.4 [P0] Appointment Booking (`POST /api/appointments`)
- Validate: `date` không quá khứ, `time` trong slot làm việc
- Check xung đột lịch (cùng bác sĩ, cùng khung giờ)
- `doctorId` phải tồn tại và đang active

### 3.5 [P0] Dispensing (`POST /api/dispensing/{id}`)
- **Check trạng thái đơn thuốc trước khi cấp phát** — không cho cấp phát đơn đã cấp phát
- Trả status rõ ràng: 200 OK, 404 Not Found, 409 Đã cấp phát

### 3.6 [P1] Xác nhận status các endpoint
- `/api/doctors`, `/api/departments`, `/api/appointments` — file `endpoints.ts` ghi chú "chưa có trong Swagger"
- **Backend cần xác nhận**: các endpoint này đã implement hay chưa?

### 3.7 [P1] Chuẩn hóa response format
- Frontend đang phải xử lý quá nhiều fallback pattern:
  - `res?.data?.data ?? res?.data ?? res`
  - `res?.data?.items ?? res?.items ?? res?.data?.data`
- **Đề xuất**: Chuẩn hóa response thành `{ success: boolean, data: T, message?: string }`

---

## 4. VALIDATION SERVER-SIDE BẮT BUỘC

| Field | Quy tắc | Áp dụng cho |
|-------|---------|-------------|
| `full_name` | 2-100 ký tự, không chứa số | Patient, User |
| `phone_number` | 10 số, đầu số VN (03/05/07/08/09) | Patient, User, Appointment |
| `email` | Email format chuẩn | User |
| `identity_number` | 9 hoặc 12 số, **check trùng** | Patient |
| `insurance_number` (BHYT) | 2 chữ cái + 13 số = 15 ký tự | Patient |
| `date_of_birth` | Không tương lai, tuổi 0-150 | Patient, User |
| `password` | Tối thiểu 6 ký tự (nên 8 + độ mạnh) | User, Auth |
| `vital_signs.*` | Range y tế hợp lệ (xem mục 3.3) | Encounter |
| `prescription.medications[]` | quantity > 0, name bắt buộc | Prescription |
| `appointment.date` | Không quá khứ, ngày làm việc | Appointment |
| `appointment.time` | Trong slot khả dụng, không trùng | Appointment |
| `prescription.status` | Không cho dispense đơn đã dispense | Dispensing |

---

## 5. VẤN ĐỀ MOCK DATA (CẦN BACKEND ĐỂ THAY THẾ)

Các trang sau đang hiển thị dữ liệu giả cho người dùng. Cần API thực để thay thế:

| Trang | Mock data | Ảnh hưởng |
|-------|-----------|-----------|
| Admin Dashboard | `MOCK_DASHBOARD_STATS` — "12.5 tỷ đồng", "1240 visits" | Thống kê hoàn toàn sai |
| Patient Dashboard | `MOCK_VITAL_SIGNS`, `MOCK_INVOICES` | Bệnh nhân thấy dữ liệu sức khỏe giả |
| Doctor Examination | `MOCK_PATIENT_QUEUE` | Không khám bệnh thật được |
| Doctor Prescriptions | `MOCK_PATIENTS` (4 bệnh nhân) | Không kê đơn cho bệnh nhân thật |
| Pharmacist Dispensing | `MOCK_DISPENSING` | Đơn thuốc giả "Trần Văn Cường" |
| Booking | `MOCK_SPECIALTIES`, `MOCK_DOCTORS` (15 bác sĩ giả) | Bệnh nhân thấy bác sĩ không tồn tại |
| Patient Health Records | `MOCK_VITAL_SIGNS`, `MOCK_LAB_RESULTS` | Kết quả xét nghiệm giả |
| Patient Billing | `MOCK_INVOICES`, `MOCK_TRANSACTIONS` | Hóa đơn giả |
| Patient Telemedicine | `MOCK_TELE_SESSIONS` | Lịch khám online giả |
| Medication Reminders | `MOCK_MEDICATION_REMINDERS` | Nhắc nhở giả, lưu localStorage |
| Admin Notifications | `MOCK_CATEGORIES`, `MOCK_TEMPLATES` | Cấu hình thông báo giả |
| Admin Activity Logs | Timestamps cố định `2024-01-27` | Logs cũ 2 năm trước |

---

## 6. TÓM TẮT ĐỘ ƯU TIÊN

### P0 — KHẨN CẤP
1. Backend validate vital signs range
2. Backend validate patient data (SĐT, CCCD, BHYT) + check trùng lặp
3. API tìm kiếm bệnh nhân cho bác sĩ
4. API hàng đợi bệnh nhân
5. Backend validate appointment (ngày quá khứ, xung đột lịch)
6. Backend check trạng thái đơn thuốc trước khi cấp phát
7. Backend support đầy đủ fields khi tạo user

### P1 — CẦN LÀM SỚM
8. API medication reminders
9. API medical services + patient profiles
10. Chuẩn hóa response format API
11. Xác nhận status các endpoint chưa rõ

### P2 — NÊN LÀM
12. Tăng password policy (8 ký tự, chữ hoa, số, ký tự đặc biệt)
13. Cân nhắc chuyển token sang HttpOnly cookie
14. API trả error message rõ ràng cho từng loại lỗi

---

## 7. GHI CHÚ KỸ THUẬT

- **Base URL:** `http://160.250.186.97:3000`
- **Swagger docs:** `http://160.250.186.97:3000/api-docs`
- **Auth:** Bearer token (JWT), refresh token flow đã có
- **File endpoints frontend:** `src/api/endpoints.ts` — đồng bộ Swagger 2026-03-08
- **File validation frontend:** `src/utils/validation.ts` — đã bổ sung `validateBloodPressure`, `validateVitalSign`, `validateAppointmentDate`

---

*Nếu có thắc mắc về bất kỳ mục nào, liên hệ Frontend team để làm rõ.*
