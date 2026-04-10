# 🖥️ E-Health Web Admin API Catalog

> Tổng hợp **toàn bộ** API endpoints cho **Website Admin Panel**, phân loại theo module và vai trò truy cập.
> Ký hiệu vai trò: 🔴 ADMIN | 🟠 STAFF | 🔵 DOCTOR | 🟢 NURSE | 🟣 ALL (Đăng nhập) | ⚪ PUBLIC

---

## MA TRẬN PHÂN QUYỀN TỔNG HỢP

| Ký hiệu | Vai trò | Mô tả |
|:---:|--------|--------|
| 🔴 | **ADMIN** | Toàn quyền hệ thống, cấu hình, phê duyệt, đối soát |
| 🟠 | **STAFF** | Nhân viên tiếp nhận, thu ngân, vận hành |
| 🔵 | **DOCTOR** | Bác sĩ — khám bệnh, kê đơn, ký số |
| 🟢 | **NURSE** | Điều dưỡng — hỗ trợ lâm sàng, xem HĐ |
| 🟣 | **ALL** | Tất cả user đã đăng nhập (verifyAccessToken) |
| ⚪ | **PUBLIC** | Không yêu cầu đăng nhập |

---

## 1. 🔐 XÁC THỰC & PHIÊN ĐĂNG NHẬP `[⚪/🟣]`

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1 | `POST` | `/api/auth/login/email` | ⚪ | Đăng nhập Email |
| 2 | `POST` | `/api/auth/login/phone` | ⚪ | Đăng nhập SĐT + OTP |
| 3 | `POST` | `/api/auth/register/email` | ⚪ | Đăng ký Email |
| 4 | `POST` | `/api/auth/register/phone` | ⚪ | Đăng ký SĐT |
| 5 | `POST` | `/api/auth/verify-email` | ⚪ | Xác thực OTP Email |
| 6 | `POST` | `/api/auth/forgot-password` | ⚪ | Quên mật khẩu |
| 7 | `POST` | `/api/auth/reset-password` | ⚪ | Đặt lại mật khẩu |
| 8 | `POST` | `/api/auth/unlock-account` | ⚪ | Mở khóa tài khoản |
| 9 | `POST` | `/api/auth/refresh-token` | ⚪ | Làm mới Access Token |
| 10 | `POST` | `/api/auth/logout` | 🟣 | Đăng xuất |
| 11 | `GET` | `/api/auth/sessions` | 🟣 | DS phiên đăng nhập |
| 12 | `POST` | `/api/auth/sessions/logout-all` | 🟣 | Đăng xuất tất cả phiên |
| 13 | `DELETE` | `/api/auth/sessions/:sessionId` | 🟣 | Đăng xuất 1 phiên |
| 14 | `GET` | `/api/auth/me/roles` | 🟣 | DS vai trò của tôi |
| 15 | `GET` | `/api/auth/me/menus` | 🟣 | DS menu được phép |
| 16 | `GET` | `/api/auth/me/permissions` | 🟣 | DS quyền hạn |

---

## 2. 👤 HỒ SƠ CÁ NHÂN `[🟣]`

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1 | `GET` | `/api/profile/me` | 🟣 | Xem hồ sơ |
| 2 | `PUT` | `/api/profile/me` | 🟣 | Cập nhật hồ sơ |
| 3 | `PUT` | `/api/profile/password` | 🟣 | Đổi mật khẩu |
| 4 | `GET` | `/api/profile/sessions` | 🟣 | DS phiên |
| 5 | `DELETE` | `/api/profile/sessions` | 🟣 | Thu hồi tất cả phiên |
| 6 | `DELETE` | `/api/profile/sessions/:sessionId` | 🟣 | Thu hồi 1 phiên |
| 7 | `PUT` | `/api/profile/settings` | 🟣 | Cài đặt cá nhân |

---

## 3. 👥 QUẢN LÝ NGƯỜI DÙNG `[🔴]`

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1 | `GET` | `/api/users` | 🔴 | DS người dùng |
| 2 | `GET` | `/api/users/:id` | 🔴 | Chi tiết user |
| 3 | `POST` | `/api/users` | 🔴 | Tạo user |
| 4 | `PUT` | `/api/users/:id` | 🔴 | Cập nhật user |
| 5 | `PATCH` | `/api/users/:id/lock` | 🔴 | Khóa tài khoản |
| 6 | `PATCH` | `/api/users/:id/unlock` | 🔴 | Mở khóa tài khoản |
| 7 | `PATCH` | `/api/users/:id/status` | 🔴 | Đổi trạng thái |
| 8 | `PATCH` | `/api/users/:id/reset-password` | 🔴 | Reset mật khẩu |
| 9 | `POST` | `/api/users/:id/roles` | 🔴 | Gán vai trò |
| 10 | `POST` | `/api/users/:id/facilities` | 🔴 | Gán cơ sở |
| 11 | `POST` | `/api/users/import` | 🔴 | Import Excel |
| 12 | `GET` | `/api/users/export` | 🔴 | Export Excel |
| 13 | `GET` | `/api/users/dropdown/facilities` | 🔴 | DS cơ sở (dropdown) |
| 14 | `GET` | `/api/users/dropdown/roles` | 🔴 | DS vai trò (dropdown) |

---

## 4. 🛡️ PHÂN QUYỀN & CẤU HÌNH HỆ THỐNG `[🔴]`

### 4.1 Vai trò & Quyền

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1 | `GET` | `/api/roles` | 🔴 | DS vai trò |
| 2 | `POST` | `/api/roles` | 🔴 | Tạo vai trò |
| 3 | `PUT` | `/api/roles/:id` | 🔴 | Cập nhật vai trò |
| 4 | `DELETE` | `/api/roles/:id` | 🔴 | Xóa vai trò |
| 5 | `GET` | `/api/roles/:id/permissions` | 🔴 | DS quyền của vai trò |
| 6 | `POST` | `/api/roles/:id/permissions` | 🔴 | Gán quyền cho vai trò |
| 7 | `GET` | `/api/permissions` | 🔴 | DS tất cả quyền |
| 8 | `POST` | `/api/permissions` | 🔴 | Tạo quyền |
| 9 | `PUT` | `/api/permissions/:id` | 🔴 | Cập nhật quyền |
| 10 | `DELETE` | `/api/permissions/:id` | 🔴 | Xóa quyền |

### 4.2 Module, Menu, API Permission

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1 | `GET` | `/api/modules` | 🔴 | DS modules |
| 2 | `GET` | `/api/menus` | 🔴 | DS menus |
| 3 | `POST` | `/api/menus` | 🔴 | Tạo menu |
| 4 | `PUT` | `/api/menus/:id` | 🔴 | Cập nhật menu |
| 5 | `DELETE` | `/api/menus/:id` | 🔴 | Xóa menu |
| 6 | `GET` | `/api/api-permissions` | 🔴 | DS API permissions |
| 7 | `POST` | `/api/api-permissions` | 🔴 | Tạo API permission |
| 8 | `PUT` | `/api/api-permissions/:id` | 🔴 | Cập nhật API permission |

### 4.3 Cấu hình hệ thống

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1 | `GET` | `/api/system/facility-info` | ⚪ | Thông tin cơ sở |
| 2 | `PUT` | `/api/system/facility-info` | 🔴 | Cập nhật thông tin cơ sở |
| 3 | `GET` | `/api/system/working-hours` | ⚪ | Giờ làm việc |
| 4 | `PUT` | `/api/system/working-hours` | 🔴 | Cập nhật giờ làm việc |
| 5 | `GET` | `/api/system/business-rules` | ⚪ | Quy tắc nghiệp vụ |
| 6 | `PUT` | `/api/system/business-rules` | 🔴 | Cập nhật quy tắc |
| 7 | `GET` | `/api/system/security` | 🔴 | Cấu hình bảo mật |
| 8 | `PUT` | `/api/system/security` | 🔴 | Cập nhật bảo mật |
| 9 | `GET` | `/api/system/i18n` | ⚪ | Cấu hình ngôn ngữ |
| 10 | `GET` | `/api/system/ui-settings` | ⚪ | Cài đặt giao diện |
| 11 | `GET` | `/api/system/settings` | 🔴 | Tham số hệ thống |
| 12 | `PUT` | `/api/system/settings` | 🔴 | Cập nhật tham số |

### 4.4 Audit Logs

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1 | `GET` | `/api/audit-logs` | 🔴 | DS nhật ký hệ thống |

---

## 5. 🏥 QUẢN LÝ CƠ SỞ Y TẾ

### 5.1 Cơ sở & Chi nhánh `[⚪/🟣]`

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1 | `GET` | `/api/facilities` | ⚪ | DS cơ sở y tế |
| 2 | `GET` | `/api/facilities/dropdown` | ⚪ | DS cơ sở (dropdown) |
| 3 | `GET` | `/api/facilities/:id` | ⚪ | Chi tiết cơ sở |
| 4 | `POST` | `/api/facilities` | 🟣 | Tạo cơ sở |
| 5 | `PUT` | `/api/facilities/:id` | 🟣 | Cập nhật cơ sở |
| 6 | `PATCH` | `/api/facilities/:id/status` | 🟣 | Đổi trạng thái |
| 7 | `DELETE` | `/api/facilities/:id` | 🟣 | Xóa cơ sở |
| 8 | `GET` | `/api/branches` | ⚪ | DS chi nhánh |
| 9 | `GET` | `/api/branches/dropdown` | ⚪ | DS chi nhánh (dropdown) |
| 10 | `GET` | `/api/branches/:id` | ⚪ | Chi tiết chi nhánh |
| 11 | `POST` | `/api/branches` | 🟣 | Tạo chi nhánh |
| 12 | `PUT` | `/api/branches/:id` | 🟣 | Cập nhật chi nhánh |
| 13 | `PATCH` | `/api/branches/:id/status` | 🟣 | Đổi trạng thái |
| 14 | `DELETE` | `/api/branches/:id` | 🟣 | Xóa chi nhánh |

### 5.2 Khoa/Phòng ban `[⚪/🟣]`

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1 | `GET` | `/api/departments` | ⚪ | DS khoa/phòng ban |
| 2 | `GET` | `/api/departments/dropdown` | ⚪ | DS dropdown |
| 3 | `GET` | `/api/departments/:id` | ⚪ | Chi tiết |
| 4 | `POST` | `/api/departments` | 🟣 | Tạo khoa |
| 5 | `PUT` | `/api/departments/:id` | 🟣 | Cập nhật |
| 6 | `PATCH` | `/api/departments/:id/status` | 🟣 | Đổi trạng thái |
| 7 | `DELETE` | `/api/departments/:id` | 🟣 | Xóa |

### 5.3 Chuyên khoa `[⚪/🟣]`

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1 | `GET` | `/api/specialties` | ⚪ | DS chuyên khoa |
| 2 | `GET` | `/api/specialties/:id` | ⚪ | Chi tiết |
| 3 | `POST` | `/api/specialties` | 🟣 | Tạo chuyên khoa |
| 4 | `PUT` | `/api/specialties/:id` | 🟣 | Cập nhật |
| 5 | `DELETE` | `/api/specialties/:id` | 🟣 | Xóa |

### 5.4 Gán chuyên khoa - Phòng ban `[⚪/🟣]`

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1 | `GET` | `/api/department-specialties/:departmentId/specialties` | ⚪ | DS CK theo phòng ban |
| 2 | `GET` | `/api/department-specialties/by-branch/:branchId` | ⚪ | DS CK theo chi nhánh |
| 3 | `GET` | `/api/department-specialties/by-facility/:facilityId` | ⚪ | DS CK theo cơ sở |
| 4 | `POST` | `/api/department-specialties/:departmentId/specialties` | 🟣 | Gán CK cho phòng ban |
| 5 | `DELETE` | `/api/department-specialties/:departmentId/specialties/:specialtyId` | 🟣 | Gỡ CK |

### 5.5 Phòng khám `[🟣]`

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1 | `GET` | `/api/medical-rooms` | 🟣 | DS phòng khám |
| 2 | `GET` | `/api/medical-rooms/:id` | 🟣 | Chi tiết |
| 3 | `POST` | `/api/medical-rooms` | 🟣 | Tạo phòng |
| 4 | `PUT` | `/api/medical-rooms/:id` | 🟣 | Cập nhật |
| 5 | `DELETE` | `/api/medical-rooms/:id` | 🟣 | Xóa |
| 6 | `GET` | `/api/room-maintenance` | 🟣 | DS bảo trì phòng |
| 7 | `POST` | `/api/room-maintenance` | 🟣 | Tạo lịch bảo trì |

### 5.6 Nhân sự y tế `[🟣]`

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1 | `GET` | `/api/staff` | 🟣 | DS nhân viên y tế |
| 2 | `GET` | `/api/staff/:id` | 🟣 | Chi tiết nhân viên |
| 3 | `POST` | `/api/staff` | 🟣 | Tạo hồ sơ NV |
| 4 | `PUT` | `/api/staff/:id` | 🟣 | Cập nhật |
| 5 | `DELETE` | `/api/staff/:id` | 🟣 | Xóa |

### 5.7 Lịch làm việc & Ca trực `[🟣]`

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1–5 | CRUD | `/api/shifts` | 🟣 | Quản lý ca trực |
| 6–10 | CRUD | `/api/staff-schedules` | 🟣 | Phân lịch nhân viên (10 endpoints) |
| 11–13 | CRUD | `/api/leaves` | 🟣 | Quản lý nghỉ phép (7 endpoints) |
| 14–18 | CRUD | `/api/shift-swaps` | 🟣 | Đổi ca (5 endpoints) |
| 19–28 | CRUD | `/api/licenses` | 🟣 | Giấy phép & chứng chỉ (10 endpoints) |

### 5.8 Giờ hoạt động `[⚪/🟣]`

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1 | `GET` | `/api/operating-hours` | ⚪ | DS giờ hoạt động |
| 2 | `GET` | `/api/operating-hours/:id` | ⚪ | Chi tiết |
| 3 | `POST` | `/api/operating-hours` | 🟣 | Tạo mới |
| 4 | `PUT` | `/api/operating-hours/:id` | 🟣 | Cập nhật |
| 5 | `DELETE` | `/api/operating-hours/:id` | 🟣 | Xóa |
| 6–8 | CRUD | `/api/closed-days` | 🟣 | Ngày đóng cửa (3 endpoints) |
| 9–13 | CRUD | `/api/holidays` | 🟣 | Ngày lễ (5 endpoints) |
| 14–16 | GET | `/api/facility-status` | 🟣 | Trạng thái hoạt động (3 endpoints) |

### 5.9 Dịch vụ y tế `[⚪/🟣]`

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1 | `GET` | `/api/medical-services/master` | ⚪ | DS dịch vụ chuẩn |
| 2 | `GET` | `/api/medical-services/master/:id` | ⚪ | Chi tiết DV |
| 3 | `POST` | `/api/medical-services/master` | 🟣 | Tạo DV |
| 4 | `PUT` | `/api/medical-services/master/:id` | 🟣 | Cập nhật |
| 5 | `DELETE` | `/api/medical-services/master/:id` | 🟣 | Xóa |
| 6 | `GET` | `/api/medical-services/master/export` | 🟣 | Export Excel |
| 7 | `POST` | `/api/medical-services/master/import` | 🟣 | Import Excel |
| 8 | `GET` | `/api/medical-services/facilities/:facilityId/services` | ⚪ | DS DV cơ sở |
| 9 | `GET` | `/api/medical-services/facilities/:facilityId/active-services` | ⚪ | DS DV đang HĐ |
| 10 | `POST` | `/api/medical-services/facilities/:facilityId/services` | 🟣 | Tạo DV cơ sở |
| 11–12 | CRUD | `/api/specialty-services` | ⚪/🟣 | Gán DV-CK (4 endpoints) |
| 13–14 | CRUD | `/api/doctor-services` | ⚪/🟣 | Gán DV-BS (5 endpoints) |

### 5.10 Thiết bị & Giường bệnh `[⚪/🟣]`

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1–11 | CRUD | `/api/equipments` | ⚪/🟣 | Thiết bị y tế (11 endpoints) |
| 12–18 | CRUD | `/api/beds` | 🟣 | Giường bệnh (7 endpoints) |
| 19–20 | CRUD | `/api/booking-configs` | 🟣 | Cấu hình đặt lịch |
| 21–22 | CRUD | `/api/slots` | 🟣 | Slot khám (5 endpoints) |

---

## 6. 🗂️ QUẢN LÝ BỆNH NHÂN `[🟣]`

| # | Module | Endpoints | Mô tả |
|---|--------|:---------:|--------|
| 1 | `/api/patients` | 30 | CRUD BN, tìm kiếm, filter tag, BH, liên hệ, tài liệu |
| 2 | `/api/insurance-providers` | 5 | CRUD đơn vị BH |
| 3 | `/api/patient-insurances` | 9 | CRUD thẻ BH bệnh nhân |
| 4 | `/api/insurance-coverage` | 4 | Cấu hình tỷ lệ chi trả |
| 5 | `/api/relation-types` | 4 | CRUD loại quan hệ |
| 6 | `/api/patient-relations` | 9 | Người thân, khẩn cấp, đại diện PL |
| 7 | `/api/document-types` | 4 | CRUD loại tài liệu |
| 8 | `/api/patient-documents` | 10 | Upload, phiên bản, xem/tải file |
| 9 | `/api/patient-tags` | 5 | CRUD thẻ phân loại |
| 10 | `/api/patient-classification-rules` | 5 | Luật tự động gắn thẻ |
| 11 | `/api/medical-history` | 5 | Lịch sử khám (Read-Only) |

> **Tổng: ~90 endpoints** — Tất cả yêu cầu `verifyAccessToken + checkSessionStatus`

---

## 7. 📅 LỊCH KHÁM `[🟣/🔴🟠]`

| # | Module | Endpoints | Mô tả |
|---|--------|:---------:|--------|
| 1 | `/api/appointments` | 9 | CRUD lịch hẹn, hủy, check-in |
| 2 | `/api/doctor-availability` | 5 | Slot trống BS |
| 3 | `/api/doctor-absences` | 5 | Lịch vắng BS |
| 4 | `/api/appointment-confirmations` | 5+ | Xác nhận, nhắc lịch |
| 5 | `/api/appointment-status` | 5+ | Check-in, trạng thái |
| 6 | `/api/appointment-changes` | 5+ | Dời lịch, lịch sử |
| 7 | `/api/appointment-coordination` | 10+ | Phân bổ tải, gợi ý slot, AI |
| 8 | `/api/shift-services` | 4+ | Gán DV cho ca khám |
| 9 | `/api/locked-slots` | 4+ | Khóa slot |
| 10 | `/api/facilities/:id/consultation-durations` | 4+ | Thời lượng khám |

> **Tổng: ~60 endpoints**

---

## 8. 📋 KHÁM BỆNH & HỒ SƠ BỆNH ÁN (EMR) `[🟣]`

| # | Module | Endpoints | Mô tả |
|---|--------|:---------:|--------|
| 1 | `/api/encounters` | 15+ | Tiếp nhận, mở HSBA, chuyển TT |
| 2 | `/api/clinical-examinations` | 10+ | Khám lâm sàng, sinh hiệu |
| 3 | `/api/diagnoses` | 8+ | Chẩn đoán ICD-10 |
| 4 | `/api/medical-orders` | 12 | Chỉ định CLS |
| 5 | `/api/prescriptions` | 10+ | Kê đơn thuốc |
| 6 | `/api/medical-records` | 10+ | Hồ sơ bệnh án |
| 7 | `/api/treatment-plans` | 8+ | Tiến trình điều trị |
| 8 | `/api/sign-off` | 8+ | Ký số, xác nhận |

> **Tổng: ~80 endpoints** — Tất cả yêu cầu `verifyAccessToken + checkSessionStatus`

---

## 9. 💊 QUẢN LÝ THUỐC `[🟣]`

| # | Module | Endpoints | Mô tả |
|---|--------|:---------:|--------|
| 1 | `/api/pharmacy/categories` | 5 | CRUD nhóm thuốc |
| 2 | `/api/pharmacy/drugs` | 7 | CRUD thuốc + Import/Export |
| 3 | `/api/dispensing` | 5+ | Cấp phát thuốc |
| 4 | `/api/inventory` | 5+ | Theo dõi tồn kho |
| 5 | `/api/warehouses` | 5 | CRUD kho thuốc |
| 6 | `/api/suppliers` | 5 | CRUD nhà cung cấp |
| 7 | `/api/stock-in` | 8+ | Nhập kho |
| 8 | `/api/stock-out` | 5+ | Xuất kho, hủy hàng |
| 9 | `/api/medication-instructions` | 5+ | Hướng dẫn sử dụng |

> **Tổng: ~50 endpoints**

---

## 10. 💚 HỒ SƠ SỨC KHỎE ĐIỆN TỬ (EHR) `[🟣]`

| # | Module | Endpoints | Mô tả |
|---|--------|:---------:|--------|
| 1 | `/api/ehr/health-profiles` | 5+ | Hồ sơ sức khỏe tổng hợp |
| 2 | `/api/ehr/timeline` | 3+ | Dòng thời gian sức khỏe |
| 3 | `/api/ehr/medical-history` | 5+ | Tiền sử bệnh |
| 4 | `/api/ehr/clinical-results` | 5+ | Kết quả xét nghiệm |
| 5 | `/api/ehr/medication-treatments` | 5+ | Hồ sơ đơn thuốc |
| 6 | `/api/ehr/vital-signs` | 5+ | Chỉ số sinh hiệu |
| 7 | `/api/ehr/data-integration` | 5+ | Tích hợp dữ liệu |

> **Tổng: ~35 endpoints**

---

## 11. 💳 THANH TOÁN (Billing)

### 11.1 Bảng giá & Chính sách `[⚪/🟣/🔴]`

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1 | `GET` | `/api/billing/pricing/catalog` | ⚪ | Bảng giá tổng hợp |
| 2 | `GET` | `/api/billing/pricing/catalog/:facilityId` | ⚪ | Bảng giá cơ sở |
| 3 | `GET` | `/api/billing/pricing/resolve` | ⚪ | Tra cứu giá |
| 4–17 | CRUD | `/api/billing/pricing/policies` + `/specialty-prices` + `/history` | 🟣 | Chính sách giá (14 endpoints) |

### 11.2 Hóa đơn `[🔴🟠🔵🟢]`

| # | Endpoints | Roles | Mô tả |
|---|:---------:|:-----:|--------|
| 1–14 | `/api/billing/invoices` | 🔴🟠 CUD / 🔴🟠🔵🟢 Read | Tạo, cập nhật, hủy HĐ (14 endpoints) |
| 15–18 | `/api/billing/payments` | 🔴🟠 | Ghi nhận thanh toán (4 endpoints) |
| 19–22 | `/api/billing/cashier-shifts` | 🔴🟠 | Ca thu ngân (4 endpoints) |

### 11.3 Thanh toán online — SePay `[🔴🟠]`

| # | Endpoints | Roles | Mô tả |
|---|:---------:|:-----:|--------|
| 1–12 | `/api/billing/payments/*` | 🔴🟠 / 🔴 config | QR, orders, gateway config (12 endpoints) |

### 11.4 Thanh toán tại quầy `[🔴🟠]`

| # | Endpoints | Roles | Mô tả |
|---|:---------:|:-----:|--------|
| 1–16 | `/api/billing/offline/*` | 🔴🟠 / 🔴 reports | Thanh toán, POS, biên lai (16 endpoints) |

### 11.5 Hóa đơn điện tử & Chứng từ `[🔴🟠🔵🟢]`

| # | Endpoints | Roles | Mô tả |
|---|:---------:|:-----:|--------|
| 1–22 | `/api/billing/documents/*` | 🔴🟠 CUD / Read thêm 🔵🟢 | HĐĐT, chứng từ, config (22 endpoints) |

### 11.6 Đối soát & Quyết toán `[🔴🟠]`

| # | Endpoints | Roles | Mô tả |
|---|:---------:|:-----:|--------|
| 1–18 | `/api/billing/reconciliation/*` | 🔴 approve / 🔴🟠 read | Đối soát, quyết toán (18 endpoints) |

### 11.7 Hoàn tiền & Điều chỉnh `[🔴🟠]`

| # | Endpoints | Roles | Mô tả |
|---|:---------:|:-----:|--------|
| 1–16 | `/api/billing/refunds/*` | 🔴 approve / 🔴🟠 CRUD | Hoàn tiền, điều chỉnh (16 endpoints) |

### 11.8 Chính sách ưu đãi `[🔴🟠]`

| # | Endpoints | Roles | Mô tả |
|---|:---------:|:-----:|--------|
| 1–22 | `/api/billing/pricing-policies/*` | 🔴 CUD / 🔴🟠 Read | Discount, voucher, bundle (22 endpoints) |

### 11.9 Phân quyền thu ngân `[🔴🟠]`

| # | Endpoints | Roles | Mô tả |
|---|:---------:|:-----:|--------|
| 1–20 | `/api/billing/cashier-auth/*` | 🔴 CUD / 🔴🟠 Read | Hồ sơ, giới hạn, ca, nhật ký (20 endpoints) |

> **Tổng Billing: ~150 endpoints**

---

## 12. 📹 KHÁM TỪ XA (Telemedicine)

### 12.1-12.9 Remote Consultation `[🔴🔵/🟣]`

| # | Module | Endpoints | Roles chính | Mô tả |
|---|--------|:---------:|:-----:|--------|
| 1 | `/api/teleconsultation/types` + `/configs` | 16 | 🔴 CUD / 🔴🔵 Read | Loại hình khám từ xa |
| 2 | `/api/teleconsultation/booking` | 12 | 🟣 / 🔴🔵 confirm | Đặt lịch tư vấn |
| 3 | `/api/teleconsultation/room` | 18 | 🟣 / 🔴🔵 admin | Phòng khám online |
| 4 | `/api/teleconsultation/medical-chat` | 15 | 🟣 / 🔴🔵 admin | Chat y tế |
| 5 | `/api/teleconsultation/results` | 14 | 🟣 / 🔴🔵 CUD | Kết quả khám |
| 6 | `/api/teleconsultation/prescriptions` | 14 | 🔴🔵 CUD / 🟣 Read | Kê đơn từ xa |
| 7 | `/api/teleconsultation/follow-ups` | 15 | 🔴🔵 CUD / 🟣 Read | Theo dõi sau tư vấn |
| 8 | `/api/teleconsultation/quality` | 14 | 🔴 admin / 🟣 review | Chất lượng & đánh giá |
| 9 | `/api/teleconsultation/admin` | 13 | 🔴 | Cấu hình, SLA, pricing |

> **Tổng Telemedicine: ~130 endpoints**

---

## 13. 🤖 AI TƯ VẤN SỨC KHỎE

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1-8 | CRUD | `/api/ai/health-chat/sessions` | 🟣 | Chat AI (8 endpoints) |
| 9 | `GET` | `/api/ai/health-chat/analytics/tokens` | 🔴🟠 | Thống kê token AI |
| 10-12 | CRUD | `/api/ai/rag/documents` | 🟣 | Upload, DS, xóa tài liệu RAG |

---

## 14. 🔔 THÔNG BÁO `[🟣/🔴]`

| # | Module | Endpoints | Roles | Mô tả |
|---|--------|:---------:|:-----:|--------|
| 1 | `/api/notifications/categories` | 5+ | 🔴 | CRUD loại thông báo |
| 2 | `/api/notifications/templates` | 5+ | 🔴 | CRUD mẫu thông báo |
| 3 | `/api/notifications/role-configs` | 5+ | 🔴 | Cấu hình theo vai trò |
| 4 | `/api/notifications/inbox` | 3 | 🟣 | Hộp thư cá nhân |

---

## 15. 📚 MASTER DATA `[🟣]`

| # | Method | Endpoint | Roles | Mô tả |
|---|--------|----------|:-----:|--------|
| 1 | `GET` | `/api/master-data/icd10` | 🟣 | DS mã ICD-10 |
| 2 | `GET` | `/api/master-data/countries` | 🟣 | DS quốc gia |
| 3 | `GET` | `/api/master-data/ethnicities` | 🟣 | DS dân tộc |

---

## 📊 THỐNG KÊ TỔNG HỢP THEO VAI TRÒ

| Module | ⚪ PUBLIC | 🟣 ALL | 🔴 ADMIN | 🟠 STAFF | 🔵 DOCTOR | 🟢 NURSE | Tổng |
|--------|:--------:|:------:|:--------:|:--------:|:---------:|:--------:|:----:|
| Auth & Session | 9 | 7 | — | — | — | — | 16 |
| Profile | — | 7 | — | — | — | — | 7 |
| User Management | — | — | 14 | — | — | — | 14 |
| Phân quyền & Config | 6 | — | 20+ | — | — | — | 26 |
| Cơ sở y tế | 15 | 80+ | ✓ | ✓ | — | — | ~95 |
| Bệnh nhân | — | 90 | ✓ | ✓ | — | — | ~90 |
| Lịch khám | — | 60 | ✓ | ✓ | ✓ | — | ~60 |
| EMR | — | 80 | ✓ | ✓ | ✓ | ✓ | ~80 |
| Thuốc | — | 50 | ✓ | ✓ | — | — | ~50 |
| EHR | — | 35 | ✓ | ✓ | ✓ | ✓ | ~35 |
| Billing | 3 | — | 150 | ✓ | ✓ | ✓ | ~150 |
| Telemedicine | — | — | 130 | — | ✓ | — | ~130 |
| AI Chat | — | 10 | 1 | 1 | — | — | ~12 |
| Thông báo | — | 3 | 15 | — | — | — | ~18 |
| Master Data | — | 3 | — | — | — | — | 3 |
| **TỔNG** | **~33** | **~425** | **Full** | **Partial** | **Partial** | **Limited** | **~520+** |

> [!NOTE]
> - ✓ = Vai trò có quyền truy cập (đọc hoặc thao tác tùy endpoint)
> - Số lượng endpoint bao gồm cả CRUD đầy đủ (Create, Read, Update, Delete)
> - Một số module sử dụng `verifyAccessToken + checkSessionStatus` thay vì `authorizeRoles`, nghĩa là tất cả user đã đăng nhập đều truy cập được

> [!IMPORTANT]
> **Đặc thù phân quyền:**
> - **ADMIN**: Toàn quyền hệ thống — duy nhất được phép: cấu hình hệ thống, phê duyệt đối soát, quản lý phân quyền thu ngân, cảnh báo chất lượng, xuất báo cáo
> - **STAFF**: Vận hành hàng ngày — tiếp nhận BN, thu ngân, tạo HĐ, đặt lịch, đối soát ca
> - **DOCTOR**: Nghiệp vụ lâm sàng — khám bệnh, kê đơn, ký số, khám từ xa, theo dõi BN
> - **NURSE**: Hỗ trợ lâm sàng — xem HĐ, xem HSBA, chỉ số sinh hiệu (quyền hạn chế nhất)
