// src/routes/Patient Management/patient.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { PatientController } from '../../controllers/Patient Management/patient.controller';
import { PatientDocumentController } from '../../controllers/Patient Management/patient-document.controller';
import { PatientTagController } from '../../controllers/Patient Management/patient-tag.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();
const uploadDoc = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Lấy danh sách hồ sơ bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_VIEW.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Bác sĩ, Y tá, Lễ tân.
 *
 *       **Mô tả chi tiết:**
 *       Trả về danh sách hồ sơ bệnh nhân có phân trang.
 *       Hỗ trợ tìm kiếm theo tên, mã bệnh nhân, số điện thoại, CMND/CCCD.
 *       Hỗ trợ lọc theo trạng thái (ACTIVE/INACTIVE) và giới tính (MALE/FEMALE/OTHER).
 *     tags: [2.1 Quản lý Hồ sơ Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên, mã BN, SĐT, CMND
 *         example: "Nguyễn"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         description: Lọc theo trạng thái hồ sơ
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER]
 *         description: Lọc theo giới tính
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng mỗi trang (tối đa 100)
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_VIEW'), PatientController.getPatients);

/**
 * @swagger
 * /api/patients/with-insurance:
 *   get:
 *     summary: Danh sách bệnh nhân CÓ bảo hiểm
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_VIEW.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *
 *       Lọc bệnh nhân có cờ has_insurance = TRUE. Phục vụ quy trình Billing nhanh.
 *     tags: [2.3.7 Trạng thái Bảo hiểm Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Danh sách bệnh nhân có bảo hiểm
 */
router.get('/with-insurance', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_VIEW'), PatientController.getPatientsWithInsurance);

/**
 * @swagger
 * /api/patients/without-insurance:
 *   get:
 *     summary: Danh sách bệnh nhân KHÔNG CÓ bảo hiểm
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_VIEW.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *
 *       Lọc bệnh nhân ACTIVE có cờ has_insurance = FALSE hoặc NULL.
 *     tags: [2.3.7 Trạng thái Bảo hiểm Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Danh sách bệnh nhân không có bảo hiểm
 */
router.get('/without-insurance', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_VIEW'), PatientController.getPatientsWithoutInsurance);
// 2.6.4: Lọc bệnh nhân theo Tag

/**
 * @swagger
 * /api/patients/filter-by-tags:
 *   get:
 *     summary: Lọc bệnh nhân theo thẻ phân loại
 *     description: |
 *       **Chức năng:** Trả về danh sách bệnh nhân có gắn thẻ phù hợp.
 *       Hỗ trợ 2 chế độ:
 *       - `matchAll=true`: bệnh nhân phải có **tất cả** tags (AND logic).
 *       - `matchAll=false` (mặc định): bệnh nhân có **bất kỳ** tag nào (OR logic).
 *
 *       Ứng dụng: CSKH lọc VIP, Marketing lọc nhóm bệnh mãn tính...
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.6.4 Lọc bệnh nhân theo thẻ]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tagIds
 *         required: true
 *         schema:
 *           type: string
 *         description: Danh sách tag ID (phân tách bằng dấu phẩy)
 *         example: "TAG_260312_ab12cd34,TAG_260312_ef56gh78"
 *       - in: query
 *         name: matchAll
 *         schema:
 *           type: boolean
 *           default: false
 *         description: true = phải có TẤT CẢ tags, false = có BẤT KỲ tag
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Danh sách bệnh nhân phù hợp (phân trang)
 *       400:
 *         description: Thiếu tagIds (FILTER_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/filter-by-tags', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_VIEW'), PatientController.filterByTags);

// 2.7 TÌM KIẾM & TRA CỨU BỆNH NHÂN

/**
 * @swagger
 * /api/patients/search:
 *   get:
 *     summary: Tìm kiếm nâng cao bệnh nhân
 *     description: |
 *       **Chức năng:** Tìm kiếm bệnh nhân theo nhiều tiêu chí kết hợp:
 *       - `keyword`: Tìm theo tên, mã bệnh nhân, SĐT, CCCD.
 *       - `gender`: Lọc giới tính.
 *       - `status`: Lọc trạng thái hồ sơ.
 *       - `ageMin` / `ageMax`: Lọc theo khoảng tuổi.
 *
 *       Kết quả có phân trang, sắp xếp theo tên A-Z.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.7 Tìm kiếm & Tra cứu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Từ khóa (tên, mã, SĐT, CCCD)
 *         example: "Nguyễn"
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *       - in: query
 *         name: ageMin
 *         schema:
 *           type: integer
 *         description: Tuổi tối thiểu
 *         example: 18
 *       - in: query
 *         name: ageMax
 *         schema:
 *           type: integer
 *         description: Tuổi tối đa
 *         example: 65
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Danh sách bệnh nhân (phân trang)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/search', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_VIEW'), PatientController.advancedSearch);

/**
 * @swagger
 * /api/patients/quick-search:
 *   get:
 *     summary: Tra cứu nhanh bệnh nhân (Autocomplete)
 *     description: |
 *       **Chức năng:** Trả về tối đa 10 bệnh nhân phù hợp với từ khóa.
 *       Tối ưu tốc độ: không đếm tổng, không JOIN, chỉ trả về trường tối thiểu.
 *       Dùng cho ô tìm kiếm nhanh / autocomplete trên giao diện.
 *
 *       **Trường trả về:** `id`, `patient_code`, `full_name`, `phone_number`, `date_of_birth`, `gender`.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.7 Tìm kiếm & Tra cứu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm (tên, mã, SĐT, CCCD)
 *         example: "BN_26"
 *     responses:
 *       200:
 *         description: Tối đa 10 kết quả (thông tin tối thiểu)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/quick-search', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_VIEW'), PatientController.quickSearch);

/**
 * @swagger
 * /api/patients/{id}/summary:
 *   get:
 *     summary: Tra cứu tóm tắt hồ sơ bệnh nhân
 *     description: |
 *       **Chức năng:** Trả về thông tin tổng hợp nhanh của bệnh nhân:
 *       - Thông tin cơ bản + tuổi (tính từ date_of_birth).
 *       - Số thẻ phân loại đang gắn (`tag_count`).
 *       - Số bảo hiểm đang có (`insurance_count`).
 *       - Số mục tiền sử bệnh (`medical_history_count`).
 *       - Số mục dị ứng (`allergy_count`).
 *
 *       Dùng để hiển thị nhanh trên patient profile card hoặc popup.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.7 Tìm kiếm & Tra cứu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân (UUID)
 *         example: "cf5abd71-7d05-44df-9a50-903e93a9a20b"
 *     responses:
 *       200:
 *         description: Thông tin tóm tắt bệnh nhân
 *       404:
 *         description: Không tìm thấy bệnh nhân (PAT_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/:id/summary', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_VIEW'), PatientController.getPatientSummary);

// 2.4.3: Liên hệ khẩn cấp 

/**
 * @swagger
 * /api/patients/{patientId}/emergency-contacts:
 *   get:
 *     summary: Danh sách liên hệ khẩn cấp của bệnh nhân
 *     description: |
 *       **Chức năng:** Trả về danh sách tất cả người thân được đánh dấu là liên hệ khẩn cấp
 *       (`is_emergency_contact = true`) của một bệnh nhân cụ thể.
 *       Kết quả JOIN thông tin loại quan hệ (relation_type_name, relation_type_code).
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_RELATION_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.4.3 Quản lý liên hệ khẩn cấp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ bệnh nhân (UUID)
 *         example: "cf5abd71-7d05-44df-9a50-903e93a9a20b"
 *     responses:
 *       200:
 *         description: Danh sách liên hệ khẩn cấp
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       patient_contacts_id:
 *                         type: string
 *                         example: "PTC_260312_a1b2c3d4"
 *                       contact_name:
 *                         type: string
 *                         example: "Nguyễn Thị Bình"
 *                       phone_number:
 *                         type: string
 *                         example: "0987654321"
 *                       is_emergency_contact:
 *                         type: boolean
 *                         example: true
 *                       relation_type_name:
 *                         type: string
 *                         example: "Mẹ"
 *       404:
 *         description: Không tìm thấy hồ sơ bệnh nhân (PTC_003)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/:patientId/emergency-contacts', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_RELATION_VIEW'), PatientController.getEmergencyContacts);

// 2.4.4: Người đại diện pháp lý

/**
 * @swagger
 * /api/patients/{patientId}/legal-representative:
 *   get:
 *     summary: Lấy người đại diện pháp lý hiện tại của bệnh nhân
 *     description: |
 *       **Chức năng:** Trả về thông tin người đại diện pháp lý hiện tại (`is_legal_representative = true`)
 *       của một bệnh nhân. Tại mỗi thời điểm chỉ có tối đa **MỘT** người đại diện.
 *       Trả về `null` trong `data` nếu bệnh nhân chưa được chỉ định người đại diện.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_RELATION_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.4.4 Chỉ định người đại diện pháp lý]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ bệnh nhân (UUID)
 *         example: "cf5abd71-7d05-44df-9a50-903e93a9a20b"
 *     responses:
 *       200:
 *         description: Thông tin người đại diện pháp lý (hoặc null)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     patient_contacts_id:
 *                       type: string
 *                       example: "PTC_260312_a1b2c3d4"
 *                     contact_name:
 *                       type: string
 *                       example: "Nguyễn Văn Nam"
 *                     phone_number:
 *                       type: string
 *                       example: "0987654321"
 *                     is_legal_representative:
 *                       type: boolean
 *                       example: true
 *                     medical_decision_note:
 *                       type: string
 *                       nullable: true
 *                       example: "Có quyền ký cam kết phẫu thuật"
 *                     relation_type_name:
 *                       type: string
 *                       example: "Cha"
 *       404:
 *         description: Không tìm thấy hồ sơ bệnh nhân (PTC_003)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/:patientId/legal-representative', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_RELATION_VIEW'), PatientController.getLegalRepresentative);

// 2.4.6: Phân biệt người thân – liên hệ khẩn cấp

/**
 * @swagger
 * /api/patients/{patientId}/relations:
 *   get:
 *     summary: Tất cả người liên hệ của bệnh nhân
 *     description: |
 *       **Chức năng:** Trả về toàn bộ danh sách người liên hệ của bệnh nhân,
 *       không phân biệt cờ (is_emergency_contact, is_legal_representative).
 *       Dùng cho màn hình quản lý tổng quan tất cả mối quan hệ.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_RELATION_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.4.6 Phân biệt người thân - liên hệ khẩn cấp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ bệnh nhân (UUID)
 *         example: "cf5abd71-7d05-44df-9a50-903e93a9a20b"
 *     responses:
 *       200:
 *         description: Danh sách tất cả người liên hệ
 *       404:
 *         description: Không tìm thấy hồ sơ bệnh nhân (PTC_003)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/:patientId/relations', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_RELATION_VIEW'), PatientController.getAllRelations);

/**
 * @swagger
 * /api/patients/{patientId}/relatives:
 *   get:
 *     summary: Danh sách người thân thông thường
 *     description: |
 *       **Chức năng:** Trả về danh sách người thân **KHÔNG** mang đặc quyền khẩn cấp
 *       và **KHÔNG** mang đặc quyền đại diện pháp lý.
 *       Điều kiện: `is_emergency_contact = false` VÀ `is_legal_representative = false`.
 *
 *       Dùng khi Frontend cần phân Tab hiển thị riêng nhóm "Người thân khác",
 *       tránh lặp tên người liên hệ đã xuất hiện ở Tab khẩn cấp / giám hộ.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_RELATION_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.4.6 Phân biệt người thân - liên hệ khẩn cấp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ bệnh nhân (UUID)
 *         example: "cf5abd71-7d05-44df-9a50-903e93a9a20b"
 *     responses:
 *       200:
 *         description: Danh sách người thân thông thường
 *       404:
 *         description: Không tìm thấy hồ sơ bệnh nhân (PTC_003)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/:patientId/relatives', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_RELATION_VIEW'), PatientController.getNormalRelatives);

/**
 * @swagger
 * /api/patients/{patientId}/guardians:
 *   get:
 *     summary: Danh sách người giám hộ
 *     description: |
 *       **Chức năng:** Trả về danh sách người giám hộ (`is_legal_representative = true`).
 *       Khác với API `/legal-representative` (Module 2.4.4) chỉ trả về 1 Object duy nhất,
 *       API này trả về **mảng (Array)** để phục vụ hiển thị theo dạng Data Table
 *       và dự phòng cho tương lai nếu cho phép nhiều Guardian cùng lúc.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_RELATION_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.4.6 Phân biệt người thân - liên hệ khẩn cấp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ bệnh nhân (UUID)
 *         example: "cf5abd71-7d05-44df-9a50-903e93a9a20b"
 *     responses:
 *       200:
 *         description: Danh sách người giám hộ
 *       404:
 *         description: Không tìm thấy hồ sơ bệnh nhân (PTC_003)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/:patientId/guardians', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_RELATION_VIEW'), PatientController.getGuardians);

/**
 * @swagger
 * /api/patients/{id}/audit-logs:
 *   get:
 *     summary: Tra cứu lịch sử thay đổi hồ sơ bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_VIEW.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Bác sĩ, Y tá, Lễ tân.
 *
 *       **Mô tả chi tiết:**
 *       Trả về danh sách lịch sử thay đổi (audit trail) của một hồ sơ bệnh nhân cụ thể.
 *       Mỗi dòng log ghi nhận:
 *       - **Người thực hiện thay đổi** (user_id, email).
 *       - **Thời gian thay đổi** (created_at).
 *       - **Loại thao tác** (CREATE, UPDATE, DELETE).
 *       - **Dữ liệu trước khi thay đổi** (old_value) — snapshot đầy đủ hồ sơ tại thời điểm trước sửa.
 *       - **Dữ liệu sau khi thay đổi** (new_value) — request body gửi lên tại thời điểm sửa.
 *
 *       Hỗ trợ lọc theo loại thao tác, khoảng thời gian, và phân trang.
 *       Phục vụ mục đích kiểm tra nội bộ và tuân thủ quy định y tế.
 *     tags: [2.9 Theo dõi & Audit Hồ sơ Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ bệnh nhân (UUID)
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *       - in: query
 *         name: action_type
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE]
 *         description: Lọc theo loại thao tác
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc từ ngày (YYYY-MM-DD)
 *         example: "2026-01-01"
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc đến ngày (YYYY-MM-DD)
 *         example: "2026-12-31"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng mỗi trang
 *     responses:
 *       200:
 *         description: Trả về danh sách lịch sử thay đổi hồ sơ bệnh nhân
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Lấy lịch sử thay đổi hồ sơ bệnh nhân thành công."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       log_id:
 *                         type: string
 *                         example: "AUDIT_1709614800000_abcd1234"
 *                       user_id:
 *                         type: string
 *                         example: "USR_001"
 *                       user_email:
 *                         type: string
 *                         example: "admin@ehealthclinic.vn"
 *                       action_type:
 *                         type: string
 *                         example: "UPDATE"
 *                       module_name:
 *                         type: string
 *                         example: "PATIENTS"
 *                       target_id:
 *                         type: string
 *                         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                       old_value:
 *                         type: object
 *                         description: Snapshot dữ liệu trước khi thay đổi
 *                       new_value:
 *                         type: object
 *                         description: Dữ liệu mới được gửi lên từ request body
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Không tìm thấy hồ sơ bệnh nhân
 */
router.get('/:id/audit-logs', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_VIEW'), PatientController.getPatientAuditTrail);

/**
 * @swagger
 * /api/patients/{patientId}/insurances:
 *   get:
 *     summary: Lấy danh sách thẻ bảo hiểm của bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_VIEW.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá, Customer, Patient.
 *
 *       Trả về danh sách thẻ bảo hiểm chỉ của bệnh nhân có ID = patientId.
 *     tags: [2.3.5 Liên kết Bảo hiểm - Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân
 *         example: "patient_uuid_here"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Danh sách thẻ bảo hiểm
 *       404:
 *         description: Không tìm thấy bệnh nhân
 */
router.get('/:patientId/insurances', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_VIEW'), PatientController.getPatientInsurances);

/**
 * @swagger
 * /api/patients/{patientId}/insurances:
 *   post:
 *     summary: Thêm thẻ bảo hiểm cho bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_UPDATE.
 *       **Vai trò được phép:** Admin, Staff, Lễ tân.
 *
 *       Thêm thẻ bảo hiểm cho bệnh nhân (patientId tự động gán từ URL).
 *       Tự động đánh dấu has_insurance = true trên bệnh nhân.
 *     tags: [2.3.5 Liên kết Bảo hiểm - Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân
 *         example: "patient_uuid_here"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider_id
 *               - insurance_number
 *               - start_date
 *               - end_date
 *             properties:
 *               provider_id:
 *                 type: string
 *                 example: "PRV_260311_a1b2c3"
 *               insurance_number:
 *                 type: string
 *                 example: "DK2-12345678901"
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-01"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-31"
 *               coverage_percent:
 *                 type: integer
 *                 example: 80
 *               is_primary:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Thêm thẻ thành công
 *       400:
 *         description: Trùng số thẻ / Ngày không hợp lệ
 *       404:
 *         description: Không tìm thấy bệnh nhân hoặc đơn vị bảo hiểm
 */
router.post('/:patientId/insurances', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_UPDATE'), PatientController.addPatientInsurance);

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Lấy chi tiết hồ sơ bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_VIEW.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Bác sĩ, Y tá, Lễ tân.
 *
 *       Trả về thông tin chi tiết hồ sơ bệnh nhân, bao gồm thông tin tài khoản Mobile App đã liên kết (nếu có).
 *     tags: [2.1 Quản lý Hồ sơ Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ bệnh nhân (UUID)
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy hồ sơ bệnh nhân
 */
router.get('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_VIEW'), PatientController.getPatientById);

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Tạo mới hồ sơ bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_CREATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Lễ tân.
 *
 *       **Mô tả chi tiết:**
 *       Tạo hồ sơ bệnh nhân mới. Hệ thống tự động:
 *       - Sinh mã bệnh nhân duy nhất (format: BN + YYMM + 5 số).
 *       - Chuẩn hóa tên (Title Case), SĐT (loại bỏ ký tự thừa), email (lowercase).
 *       - Kiểm tra trùng CMND/CCCD.
 *       - Validate ngày sinh không trong tương lai.
 *
 *       **Các trường bắt buộc:** `full_name`, `date_of_birth`, `gender`.
 *     tags: [2.1 Quản lý Hồ sơ Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, date_of_birth, gender]
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "Nguyễn Văn An"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 example: "MALE"
 *               phone_number:
 *                 type: string
 *                 example: "0901234567"
 *               email:
 *                 type: string
 *                 example: "nguyenvanan@gmail.com"
 *               id_card_number:
 *                 type: string
 *                 example: "079090123456"
 *               address:
 *                 type: string
 *                 example: "123 Nguyễn Trãi, Phường 2, Quận 5"
 *               province_id:
 *                 type: integer
 *                 example: 79
 *               district_id:
 *                 type: integer
 *                 example: 760
 *               ward_id:
 *                 type: integer
 *                 example: 26734
 *               emergency_contact_name:
 *                 type: string
 *                 example: "Nguyễn Thị Bình"
 *               emergency_contact_phone:
 *                 type: string
 *                 example: "0987654321"
 *     responses:
 *       201:
 *         description: Tạo hồ sơ bệnh nhân thành công
 *       400:
 *         description: Dữ liệu không hợp lệ (thiếu trường bắt buộc, CMND trùng, ngày sinh sai, ...)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.post('/', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_CREATE'), PatientController.createPatient);

/**
 * @swagger
 * /api/patients/{id}:
 *   put:
 *     summary: Cập nhật thông tin hành chính bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_UPDATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Lễ tân.
 *
 *       **Mô tả chi tiết:**
 *       Cập nhật thông tin hành chính bệnh nhân: tên, ngày sinh, giới tính, SĐT, email, CMND, địa chỉ, người liên hệ khẩn cấp.
 *       Chỉ các trường được gửi lên mới được cập nhật (partial update).
 *       Hệ thống tự chuẩn hóa dữ liệu và kiểm tra trùng CMND nếu thay đổi.
 *     tags: [2.1 Quản lý Hồ sơ Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ bệnh nhân (UUID)
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "Nguyễn Văn An"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 example: "MALE"
 *               phone_number:
 *                 type: string
 *                 example: "0909876543"
 *               email:
 *                 type: string
 *                 example: "updated@email.com"
 *               id_card_number:
 *                 type: string
 *                 example: "079090654321"
 *               address:
 *                 type: string
 *                 example: "456 Lê Lợi, Quận 1"
 *               province_id:
 *                 type: integer
 *                 example: 79
 *               district_id:
 *                 type: integer
 *                 example: 760
 *               ward_id:
 *                 type: integer
 *                 example: 26734
 *               emergency_contact_name:
 *                 type: string
 *                 example: "Trần Văn C"
 *               emergency_contact_phone:
 *                 type: string
 *                 example: "0912345678"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy hồ sơ bệnh nhân
 */
router.put('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_UPDATE'), PatientController.updatePatient);

/**
 * @swagger
 * /api/patients/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái hồ sơ bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_UPDATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở.
 *
 *       **Mô tả chi tiết:**
 *       Chuyển trạng thái hồ sơ bệnh nhân:
 *       - `ACTIVE`: Hồ sơ đang hoạt động, bệnh nhân đang được theo dõi.
 *       - `INACTIVE`: Ngưng theo dõi (ví dụ: bệnh nhân không quay lại tái khám, yêu cầu ngưng dịch vụ).
 *     tags: [2.1 Quản lý Hồ sơ Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ bệnh nhân (UUID)
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: "INACTIVE"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       400:
 *         description: Trạng thái không hợp lệ
 *       404:
 *         description: Không tìm thấy hồ sơ bệnh nhân
 */
router.patch('/:id/status', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_UPDATE'), PatientController.updateStatus);

/**
 * @swagger
 * /api/patients/{id}/link-account:
 *   patch:
 *     summary: Liên kết hồ sơ bệnh nhân với tài khoản Mobile App
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_UPDATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở, Lễ tân.
 *
 *       **Mô tả chi tiết:**
 *       Liên kết hồ sơ bệnh nhân với một tài khoản Mobile App (`auth_accounts`).
 *       Cho phép 1 tài khoản App quản lý nhiều hồ sơ (ví dụ: Mẹ đặt lịch cho con).
 *       Nếu hồ sơ đã được liên kết với tài khoản khác, API sẽ trả về lỗi.
 *     tags: [2.1 Quản lý Hồ sơ Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ bệnh nhân (UUID)
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [account_id]
 *             properties:
 *               account_id:
 *                 type: string
 *                 description: ID tài khoản người dùng (users_id trong auth_accounts)
 *                 example: "usr_abc123"
 *     responses:
 *       200:
 *         description: Liên kết thành công
 *       400:
 *         description: Hồ sơ đã liên kết với tài khoản khác
 *       404:
 *         description: Không tìm thấy hồ sơ hoặc tài khoản
 */
router.patch('/:id/link-account', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_UPDATE'), PatientController.linkAccount);

/**
 * @swagger
 * /api/patients/{id}/unlink-account:
 *   patch:
 *     summary: Hủy liên kết tài khoản khỏi hồ sơ bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_UPDATE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở.
 *
 *       **Mô tả chi tiết:**
 *       Hủy liên kết tài khoản Mobile App khỏi hồ sơ bệnh nhân. Đặt `account_id` về `NULL`.
 *       Thao tác này không xóa tài khoản hay hồ sơ, chỉ gỡ bỏ mối liên kết.
 *     tags: [2.1 Quản lý Hồ sơ Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ bệnh nhân (UUID)
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     responses:
 *       200:
 *         description: Hủy liên kết thành công
 *       404:
 *         description: Không tìm thấy hồ sơ bệnh nhân
 */
router.patch('/:id/unlink-account', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_UPDATE'), PatientController.unlinkAccount);

/**
 * @swagger
 * /api/patients/{id}/insurance-status:
 *   patch:
 *     summary: Cập nhật cờ trạng thái bảo hiểm bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_UPDATE.
 *       **Vai trò được phép:** Admin, Staff.
 *
 *       Cập nhật thủ công cờ has_insurance cho bệnh nhân.
 *       Lưu ý: Cờ này cũng được cập nhật tự động khi thêm/xóa thẻ bảo hiểm.
 *     tags: [2.3.7 Trạng thái Bảo hiểm Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân
 *         example: "patient_uuid_here"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [has_insurance]
 *             properties:
 *               has_insurance:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy bệnh nhân
 */
router.patch('/:id/insurance-status', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_UPDATE'), PatientController.updateInsuranceStatus);

/**
 * @swagger
 * /api/patients/{id}:
 *   delete:
 *     summary: Xóa hồ sơ bệnh nhân (soft delete)
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền PATIENT_DELETE.
 *       **Vai trò được phép:** Super Admin, Admin cơ sở.
 *
 *       **Mô tả chi tiết:**
 *       Xóa mềm (soft delete) hồ sơ bệnh nhân. Dữ liệu không bị mất, chỉ đánh dấu `deleted_at`.
 *       Hồ sơ đã xóa sẽ không xuất hiện trong danh sách tìm kiếm.
 *     tags: [2.1 Quản lý Hồ sơ Bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ bệnh nhân (UUID)
 *         example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy hồ sơ bệnh nhân
 */
router.delete('/:id', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_DELETE'), PatientController.deletePatient);

// =========================================================================
// 2.5.3 GẮN TÀI LIỆU TRỰC TIẾP VÀO HỒ SƠ BỆNH NHÂN (Patient-centric)
// =========================================================================

/**
 * @swagger
 * /api/patients/{patientId}/documents:
 *   get:
 *     summary: Danh sách tài liệu của bệnh nhân
 *     description: |
 *       **Chức năng:** Lấy toàn bộ tài liệu đã upload cho bệnh nhân cụ thể.
 *       Equivalent với `GET /api/patient-documents?patient_id={patientId}` nhưng URL tường minh hơn.
 *       Hỗ trợ phân trang và filter theo loại tài liệu.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_DOC_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.5.3 Gắn tài liệu vào hồ sơ bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân (UUID)
 *         example: "cf5abd71-7d05-44df-9a50-903e93a9a20b"
 *       - in: query
 *         name: document_type_id
 *         schema:
 *           type: string
 *         description: Filter theo loại tài liệu (tùy chọn)
 *         example: "DCT_260312_a1b2c3d4"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Danh sách tài liệu (phân trang)
 *       404:
 *         description: Không tìm thấy bệnh nhân (DOC_003)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/:patientId/documents', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_DOC_VIEW'), (req, res, next) => {
    // Inject patientId từ path vào query để tái dùng service logic
    req.query.patient_id = req.params.patientId;
    return PatientDocumentController.getList(req, res, next);
});

/**
 * @swagger
 * /api/patients/{patientId}/documents:
 *   post:
 *     summary: Upload tài liệu cho bệnh nhân
 *     description: |
 *       **Chức năng:** Upload tài liệu cho bệnh nhân một cách tường minh.
 *       `patientId` được lấy từ URL path thay vì truyền trong request body.
 *       Định dạng cho phép: JPG, PNG, WEBP, PDF. Kích thước tối đa: 5MB.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_DOC_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.5.3 Gắn tài liệu vào hồ sơ bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân (UUID)
 *         example: "cf5abd71-7d05-44df-9a50-903e93a9a20b"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, document_type_id, document_name]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               document_type_id:
 *                 type: string
 *                 example: "DCT_260312_a1b2c3d4"
 *               document_name:
 *                 type: string
 *                 example: "CCCD Nguyễn Văn A"
 *               notes:
 *                 type: string
 *                 example: "Bản scan mặt trước"
 *     responses:
 *       201:
 *         description: Upload thành công
 *       400:
 *         description: File không hợp lệ hoặc thiếu trường bắt buộc
 *       404:
 *         description: Không tìm thấy bệnh nhân (DOC_003)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.post('/:patientId/documents', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_DOC_MANAGE'), uploadDoc.single('file'), (req, res, next) => {
    // Inject patientId từ path vào body để tái dùng upload logic
    req.body.patient_id = req.params.patientId;
    return PatientDocumentController.upload(req, res, next);
});

// 2.6.2 GẮN/GỠ THẺ CHO BỆNH NHÂN (Patient Tag Assignments)

/**
 * @swagger
 * /api/patients/{patientId}/tags:
 *   post:
 *     summary: Gắn thẻ cho bệnh nhân
 *     description: |
 *       **Chức năng:** Gắn một thẻ phân loại cho hồ sơ bệnh nhân.
 *       Hệ thống sẽ tự động kiểm tra:
 *       - Bệnh nhân có tồn tại không.
 *       - Thẻ có tồn tại và đang active không.
 *       - Bệnh nhân đã được gắn thẻ này chưa (chống trùng lặp).
 *       Lưu thông tin người gắn thẻ (assigned_by) từ JWT token.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_TAG_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.6.2 Gắn thẻ bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân (UUID)
 *         example: "cf5abd71-7d05-44df-9a50-903e93a9a20b"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tag_id]
 *             properties:
 *               tag_id:
 *                 type: string
 *                 description: ID thẻ cần gắn
 *                 example: "TAG_260312_ab12cd34"
 *     responses:
 *       201:
 *         description: Gắn thẻ thành công
 *       400:
 *         description: Đã gắn thẻ này rồi (PTAG_003)
 *       404:
 *         description: Không tìm thấy bệnh nhân (PTAG_001) hoặc thẻ (PTAG_002)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.post('/:patientId/tags', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_TAG_MANAGE'), PatientTagController.assignTag);

/**
 * @swagger
 * /api/patients/{patientId}/tags:
 *   get:
 *     summary: Danh sách thẻ đang gắn trên bệnh nhân
 *     description: |
 *       **Chức năng:** Trả về tất cả các thẻ đang được gắn cho bệnh nhân,
 *       kèm thông tin tag như code, tên, mã màu để hiển thị trên UI.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_TAG_VIEW`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.6.2 Gắn thẻ bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân (UUID)
 *         example: "cf5abd71-7d05-44df-9a50-903e93a9a20b"
 *     responses:
 *       200:
 *         description: Danh sách thẻ (kèm thông tin tag_code, tag_name, tag_color_hex)
 *       404:
 *         description: Không tìm thấy bệnh nhân (PTAG_001)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.get('/:patientId/tags', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_TAG_VIEW'), PatientTagController.getPatientTags);

/**
 * @swagger
 * /api/patients/{patientId}/tags/{tagId}:
 *   delete:
 *     summary: Gỡ thẻ khỏi bệnh nhân
 *     description: |
 *       **Chức năng:** Xóa cứng bản ghi mapping giữa bệnh nhân và thẻ.
 *       Thẻ vẫn tồn tại trong danh mục, chỉ mất liên kết với bệnh nhân này.
 *
 *       **Phân quyền:** Yêu cầu quyền `PATIENT_TAG_MANAGE`.
 *       **Vai trò được phép:** Admin, Staff, Bác sĩ, Y tá.
 *     tags: [2.6.2 Gắn thẻ bệnh nhân]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân (UUID)
 *         example: "cf5abd71-7d05-44df-9a50-903e93a9a20b"
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thẻ cần gỡ
 *         example: "TAG_260312_ab12cd34"
 *     responses:
 *       200:
 *         description: Gỡ thẻ thành công
 *       404:
 *         description: Không tìm thấy bản ghi gắn thẻ (PTAG_004)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền
 */
router.delete('/:patientId/tags/:tagId', verifyAccessToken, checkSessionStatus, authorizePermissions('PATIENT_TAG_MANAGE'), PatientTagController.removeTag);

// =====================================================================
// 3.1.7. GẮN LỊCH KHÁM VỚI HỒ SƠ BỆNH NHÂN
// =====================================================================

import { AppointmentController } from '../../controllers/Appointment Management/appointment.controller';

/**
 * @swagger
 * /api/patients/{patientId}/appointments:
 *   get:
 *     summary: Lấy danh sách lịch khám của bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_VIEW.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE.
 *
 *       **Mô tả chi tiết:**
 *       - Trả về tất cả lịch khám của bệnh nhân `patientId` (phân trang).
 *       - Hỗ trợ filter: `status`, `fromDate`, `toDate`.
 *       - JOIN: tên bác sĩ, phòng, slot, dịch vụ.
 *       - Dùng cho màn hình hồ sơ bệnh nhân.
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân
 *         example: "cf5abd71-7d05-44df-9a50-903e93a9a20b"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CHECKED_IN, CANCELLED, NO_SHOW, COMPLETED]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Từ ngày
 *         example: "2026-01-01"
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Đến ngày
 *         example: "2026-12-31"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lấy danh sách lịch khám của bệnh nhân thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
router.get('/:patientId/appointments', verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_VIEW'), AppointmentController.getByPatient);

/**
 * @swagger
 * /api/patients/{patientId}/appointments:
 *   post:
 *     summary: Tạo lịch khám trực tiếp từ hồ sơ bệnh nhân
 *     description: |
 *       **Phân quyền:** Yêu cầu quyền APPOINTMENT_CREATE.
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR.
 *
 *       **Mô tả chi tiết:**
 *       - `patient_id` tự động lấy từ URL, không cần gửi trong body.
 *       - `booking_channel` mặc định = `DIRECT_CLINIC` nếu không truyền.
 *       - Tái sử dụng toàn bộ validation + conflict check của `POST /api/appointments`.
 *     tags: [3.1 Quản lý Lịch khám]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bệnh nhân
 *         example: "cf5abd71-7d05-44df-9a50-903e93a9a20b"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appointment_date
 *             properties:
 *               appointment_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-20"
 *               booking_channel:
 *                 type: string
 *                 enum: [DIRECT_CLINIC, WEB, APP, HOTLINE]
 *                 example: "DIRECT_CLINIC"
 *               reason_for_visit:
 *                 type: string
 *                 example: "Tái khám huyết áp"
 *               doctor_id:
 *                 type: string
 *                 example: "DOC_2603_abc12345"
 *               slot_id:
 *                 type: string
 *                 example: "SLT_2603_abc12345"
 *               room_id:
 *                 type: string
 *                 example: "RM_HCM_N101"
 *               facility_service_id:
 *                 type: string
 *                 example: "FSRV_KHAMNOI"
 *     responses:
 *       201:
 *         description: Tạo lịch khám thành công
 *       400:
 *         description: Thiếu dữ liệu / Slot đầy / Trùng lịch
 *       404:
 *         description: Bệnh nhân / Bác sĩ / Slot không tồn tại
 */
router.post('/:patientId/appointments', verifyAccessToken, checkSessionStatus, authorizePermissions('APPOINTMENT_CREATE'), AppointmentController.createByPatient);

export const patientRoutes = router;
