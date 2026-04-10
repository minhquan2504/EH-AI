import { Router } from 'express';
import { PrescriptionController } from '../../controllers/EMR/prescription.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const prescriptionRoutes = Router();

// =====================================================================
// HỖ TRỢ (đặt trước để tránh conflict với :encounterId param)
// =====================================================================

/**
 * @swagger
 * /api/prescriptions/search-drugs:
 *   get:
 *     summary: Tìm kiếm thuốc (autocomplete)
 *     description: |
 *       Tìm kiếm thuốc theo mã thuốc, tên thuốc, hoặc hoạt chất.
 *       Dùng cho chức năng autocomplete khi BS kê đơn.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `EMR_PRESCRIPTION_CREATE`).
 *     tags:
 *       - "4.5 Prescription Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           example: "amlodipin"
 *         description: Từ khóa tìm kiếm (mã thuốc / tên / hoạt chất)
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           example: ""
 *         description: Lọc theo nhóm thuốc (optional)
 *     responses:
 *       200:
 *         description: Tìm kiếm thuốc thành công
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
 *                   example: "Tìm kiếm thuốc thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       drugs_id:
 *                         type: string
 *                       drug_code:
 *                         type: string
 *                       brand_name:
 *                         type: string
 *                       active_ingredients:
 *                         type: string
 *                       category_name:
 *                         type: string
 *                       route_of_administration:
 *                         type: string
 *                       dispensing_unit:
 *                         type: string
 *                       is_prescription_only:
 *                         type: boolean
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 */
prescriptionRoutes.get(
    '/search-drugs',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_PRESCRIPTION_CREATE'),
    PrescriptionController.searchDrugs
);

// =====================================================================
// MODULE 5.9 – TRA CỨU & TÌM KIẾM ĐƠN THUỐC
// =====================================================================

/**
 * @swagger
 * /api/prescriptions/search:
 *   get:
 *     summary: Tìm kiếm đơn thuốc tổng hợp
 *     description: |
 *       Tìm kiếm đơn thuốc theo nhiều tiêu chí kết hợp: text search (mã đơn / tên bệnh nhân / tên bác sĩ),
 *       trạng thái, bác sĩ kê, bệnh nhân, khoảng thời gian. Hỗ trợ phân trang.
 *
 *       Mỗi kết quả kèm `detail_count` — số dòng thuốc trong đơn.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST (ai có quyền `EMR_PRESCRIPTION_VIEW`).
 *     tags:
 *       - "4.5 Prescription Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *           example: ""
 *         description: Text search (mã đơn / tên BN / tên BS)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PRESCRIBED, DISPENSED, CANCELLED]
 *           example: ""
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: string
 *           example: ""
 *         description: Lọc theo bác sĩ kê đơn
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: string
 *           example: ""
 *         description: Lọc theo bệnh nhân
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *           example: ""
 *         description: Từ ngày
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *           example: ""
 *         description: Đến ngày
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Tìm kiếm đơn thuốc thành công
 *       401:
 *         description: Chưa đăng nhập
 */
prescriptionRoutes.get(
    '/search',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_PRESCRIPTION_VIEW'),
    PrescriptionController.search
);

/**
 * @swagger
 * /api/prescriptions/search/stats:
 *   get:
 *     summary: Thống kê đơn thuốc theo trạng thái
 *     description: |
 *       Đếm số đơn thuốc theo từng trạng thái (DRAFT, PRESCRIBED, DISPENSED, CANCELLED).
 *       Hỗ trợ filter theo bác sĩ, bệnh nhân, khoảng thời gian.
 *       Dùng cho dashboard tổng quan.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST (ai có quyền `EMR_PRESCRIPTION_VIEW`).
 *     tags:
 *       - "4.5 Prescription Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: string
 *           example: ""
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: string
 *           example: ""
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *           example: ""
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *           example: ""
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
 */
prescriptionRoutes.get(
    '/search/stats',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_PRESCRIPTION_VIEW'),
    PrescriptionController.getStats
);

/**
 * @swagger
 * /api/prescriptions/search/by-code/{code}:
 *   get:
 *     summary: Tìm đơn thuốc theo mã đơn
 *     description: |
 *       Tra cứu đơn thuốc bằng mã đơn (prescription_code). Trả về thông tin đơn kèm danh sách dòng thuốc chi tiết.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST (ai có quyền `EMR_PRESCRIPTION_VIEW`).
 *     tags:
 *       - "4.5 Prescription Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           example: "RX-260317-2AA51C3D"
 *         description: Mã đơn thuốc (prescription_code)
 *     responses:
 *       200:
 *         description: Lấy đơn thuốc thành công
 *       404:
 *         description: Không tìm thấy đơn thuốc
 */
prescriptionRoutes.get(
    '/search/by-code/:code',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_PRESCRIPTION_VIEW'),
    PrescriptionController.searchByCode
);

/**
 * @swagger
 * /api/prescriptions/by-patient/{patientId}:
 *   get:
 *     summary: Lịch sử đơn thuốc theo bệnh nhân
 *     description: |
 *       Lấy danh sách tất cả đơn thuốc của bệnh nhân, hỗ trợ phân trang và lọc.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST (ai có quyền `EMR_PRESCRIPTION_VIEW`).
 *     tags:
 *       - "4.5 Prescription Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           example: "1"
 *         description: ID bệnh nhân
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PRESCRIBED, DISPENSED, CANCELLED]
 *           example: ""
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *           example: ""
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *           example: ""
 *     responses:
 *       200:
 *         description: Lấy lịch sử đơn thuốc thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Bệnh nhân không tồn tại
 */
prescriptionRoutes.get(
    '/by-patient/:patientId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_PRESCRIPTION_VIEW'),
    PrescriptionController.getByPatient
);

/**
 * @swagger
 * /api/prescriptions/by-doctor/{doctorId}:
 *   get:
 *     summary: Lịch sử đơn thuốc theo bác sĩ
 *     description: |
 *       Lấy danh sách tất cả đơn thuốc mà bác sĩ đã kê, hỗ trợ phân trang và lọc.
 *       Dùng cho bác sĩ xem lại lịch sử kê đơn hoặc Admin tra cứu.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE (ai có quyền `EMR_PRESCRIPTION_VIEW`).
 *     tags:
 *       - "4.5 Prescription Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *           example: "USR_0001"
 *         description: ID bác sĩ (users_id)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PRESCRIBED, DISPENSED, CANCELLED]
 *           example: ""
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *           example: ""
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *           example: ""
 *     responses:
 *       200:
 *         description: Lấy lịch sử đơn thuốc theo bác sĩ thành công
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
 *                   example: "Lấy lịch sử đơn thuốc theo bác sĩ thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Bác sĩ không tồn tại
 */
prescriptionRoutes.get(
    '/by-doctor/:doctorId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_PRESCRIPTION_VIEW'),
    PrescriptionController.getByDoctor
);

/**
 * @swagger
 * /api/prescriptions/details/{detailId}:
 *   patch:
 *     summary: Sửa dòng thuốc trong đơn
 *     description: |
 *       Cập nhật thông tin dòng thuốc (số lượng, liều dùng, tần suất, v.v.).
 *       Chỉ cho phép khi đơn thuốc ở trạng thái **DRAFT**.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `EMR_PRESCRIPTION_EDIT`).
 *     tags:
 *       - "4.5 Prescription Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: detailId
 *         required: true
 *         schema:
 *           type: string
 *           example: "RXD_260317_a1b2c3d4"
 *         description: ID dòng thuốc
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 60
 *               dosage:
 *                 type: string
 *                 example: "10mg"
 *               frequency:
 *                 type: string
 *                 example: "2 lần/ngày (sáng, tối)"
 *               duration_days:
 *                 type: integer
 *                 example: 30
 *               usage_instruction:
 *                 type: string
 *                 example: "Uống sau ăn 30 phút"
 *               route_of_administration:
 *                 type: string
 *                 enum: [ORAL, INJECTION, TOPICAL, INHALATION, SUBLINGUAL, RECTAL, OPHTHALMIC, OTIC, NASAL, OTHER]
 *                 example: "ORAL"
 *               notes:
 *                 type: string
 *                 example: "Tăng liều sau 1 tuần nếu HA chưa giảm"
 *     responses:
 *       200:
 *         description: Cập nhật dòng thuốc thành công
 *       400:
 *         description: Đơn thuốc không ở trạng thái DRAFT
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy dòng thuốc
 */
prescriptionRoutes.patch(
    '/details/:detailId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_PRESCRIPTION_EDIT'),
    PrescriptionController.updateDetail
);

/**
 * @swagger
 * /api/prescriptions/details/{detailId}:
 *   delete:
 *     summary: Xóa dòng thuốc khỏi đơn (soft delete)
 *     description: |
 *       Xóa mềm dòng thuốc (đánh dấu is_active = false).
 *       Chỉ cho phép khi đơn thuốc ở trạng thái **DRAFT**.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `EMR_PRESCRIPTION_EDIT`).
 *     tags:
 *       - "4.5 Prescription Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: detailId
 *         required: true
 *         schema:
 *           type: string
 *           example: "RXD_260317_a1b2c3d4"
 *         description: ID dòng thuốc
 *     responses:
 *       200:
 *         description: Xóa dòng thuốc thành công
 *       400:
 *         description: Đơn thuốc không ở trạng thái DRAFT
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy dòng thuốc
 */
prescriptionRoutes.delete(
    '/details/:detailId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_PRESCRIPTION_EDIT'),
    PrescriptionController.deleteDetail
);

// =====================================================================
// ĐƠN THUỐC THEO ENCOUNTER
// =====================================================================

/**
 * @swagger
 * /api/prescriptions/{encounterId}:
 *   post:
 *     summary: Tạo đơn thuốc cho encounter
 *     description: |
 *       Tạo đơn thuốc mới cho lượt khám (encounter).
 *       Mỗi encounter chỉ được tạo tối đa **1 đơn thuốc**.
 *       Encounter phải ở trạng thái **IN_PROGRESS** hoặc **WAITING_FOR_RESULTS**.
 *       Đơn thuốc được tạo với trạng thái **DRAFT**.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `EMR_PRESCRIPTION_CREATE`).
 *     tags:
 *       - "4.5 Prescription Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260317_a1b2c3d4"
 *         description: ID lượt khám
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clinical_diagnosis:
 *                 type: string
 *                 example: "Tăng huyết áp vô căn"
 *                 description: "Chẩn đoán lâm sàng (text tự do)"
 *               doctor_notes:
 *                 type: string
 *                 example: "Uống thuốc đều, tái khám sau 2 tuần"
 *                 description: "Ghi chú của BS"
 *               primary_diagnosis_id:
 *                 type: string
 *                 example: ""
 *                 description: "ID chẩn đoán chính (from encounter_diagnoses, optional)"
 *     responses:
 *       201:
 *         description: Tạo đơn thuốc thành công
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
 *                   example: "Tạo đơn thuốc thành công"
 *                 data:
 *                   $ref: '#/components/schemas/PrescriptionRecord'
 *       400:
 *         description: Encounter không ở trạng thái cho phép
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Encounter không tồn tại
 *       409:
 *         description: Encounter đã có đơn thuốc
 */
prescriptionRoutes.post(
    '/:encounterId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_PRESCRIPTION_CREATE'),
    PrescriptionController.create
);

/**
 * @swagger
 * /api/prescriptions/{encounterId}:
 *   get:
 *     summary: Lấy đơn thuốc theo encounter
 *     description: |
 *       Trả về đơn thuốc (header) và danh sách dòng thuốc chi tiết của lượt khám.
 *       Nếu encounter chưa có đơn thuốc, data sẽ trả về null.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST (ai có quyền `EMR_PRESCRIPTION_VIEW`).
 *     tags:
 *       - "4.5 Prescription Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260317_a1b2c3d4"
 *         description: ID lượt khám
 *     responses:
 *       200:
 *         description: Lấy thông tin đơn thuốc thành công
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
 *                     prescription:
 *                       $ref: '#/components/schemas/PrescriptionRecord'
 *                     details:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PrescriptionDetailRecord'
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Encounter không tồn tại
 */
prescriptionRoutes.get(
    '/:encounterId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_PRESCRIPTION_VIEW'),
    PrescriptionController.getByEncounterId
);

/**
 * @swagger
 * /api/prescriptions/{encounterId}/summary:
 *   get:
 *     summary: Tóm tắt đơn thuốc cho encounter
 *     description: |
 *       Trả về bản tóm tắt đơn thuốc gồm thông tin header và
 *       danh sách thuốc tóm tắt (tên, liều, tần suất, số lượng).
 *       Dùng cho BS review nhanh hoặc hiển thị trên bệnh án.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST (ai có quyền `EMR_PRESCRIPTION_VIEW`).
 *     tags:
 *       - "4.5 Prescription Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260317_a1b2c3d4"
 *         description: ID lượt khám
 *     responses:
 *       200:
 *         description: Lấy tóm tắt đơn thuốc thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Encounter không tồn tại
 */
prescriptionRoutes.get(
    '/:encounterId/summary',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_PRESCRIPTION_VIEW'),
    PrescriptionController.getSummary
);

// =====================================================================
// THAO TÁC TRÊN ĐƠN THUỐC THEO ID
// =====================================================================

/**
 * @swagger
 * /api/prescriptions/{prescriptionId}/update:
 *   patch:
 *     summary: Cập nhật thông tin đơn thuốc
 *     description: |
 *       Cập nhật chẩn đoán lâm sàng, ghi chú BS, hoặc liên kết chẩn đoán chính.
 *       Chỉ cho phép khi đơn thuốc ở trạng thái **DRAFT**.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `EMR_PRESCRIPTION_EDIT`).
 *     tags:
 *       - "4.5 Prescription Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: prescriptionId
 *         required: true
 *         schema:
 *           type: string
 *           example: "RX_260317_a1b2c3d4"
 *         description: ID đơn thuốc
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clinical_diagnosis:
 *                 type: string
 *                 example: "Tăng HA + Đái tháo đường type 2"
 *               doctor_notes:
 *                 type: string
 *                 example: "Kiểm soát đường huyết, tái khám 1 tuần"
 *               primary_diagnosis_id:
 *                 type: string
 *                 example: ""
 *                 description: "ID chẩn đoán chính (optional, phải thuộc encounter)"
 *     responses:
 *       200:
 *         description: Cập nhật đơn thuốc thành công
 *       400:
 *         description: Đơn thuốc không ở trạng thái DRAFT hoặc chẩn đoán không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn thuốc
 */
prescriptionRoutes.patch(
    '/:prescriptionId/update',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_PRESCRIPTION_EDIT'),
    PrescriptionController.update
);

/**
 * @swagger
 * /api/prescriptions/{prescriptionId}/confirm:
 *   patch:
 *     summary: Xác nhận đơn thuốc (DRAFT → PRESCRIBED)
 *     description: |
 *       Xác nhận đơn thuốc, chuyển trạng thái từ **DRAFT** sang **PRESCRIBED**.
 *       Sau khi xác nhận, đơn thuốc không thể chỉnh sửa.
 *
 *       **Điều kiện:**
 *       - Đơn thuốc phải ở trạng thái DRAFT
 *       - Phải có ít nhất 1 dòng thuốc active
 *       - Encounter phải ở trạng thái cho phép (IN_PROGRESS / WAITING_FOR_RESULTS)
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `EMR_PRESCRIPTION_EDIT`).
 *     tags:
 *       - "4.5 Prescription Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: prescriptionId
 *         required: true
 *         schema:
 *           type: string
 *           example: "RX_260317_a1b2c3d4"
 *         description: ID đơn thuốc
 *     responses:
 *       200:
 *         description: Xác nhận đơn thuốc thành công
 *       400:
 *         description: |
 *           - Đơn thuốc không ở trạng thái DRAFT
 *           - Đơn thuốc chưa có dòng thuốc nào
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn thuốc
 */
prescriptionRoutes.patch(
    '/:prescriptionId/confirm',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_PRESCRIPTION_EDIT'),
    PrescriptionController.confirm
);

/**
 * @swagger
 * /api/prescriptions/{prescriptionId}/cancel:
 *   patch:
 *     summary: Hủy đơn thuốc
 *     description: |
 *       Hủy đơn thuốc, chuyển trạng thái sang **CANCELLED**.
 *       - Nếu đơn đang DRAFT: hủy trực tiếp (không cần lý do)
 *       - Nếu đơn đang PRESCRIBED: **bắt buộc** nhập lý do hủy
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `EMR_PRESCRIPTION_EDIT`).
 *     tags:
 *       - "4.5 Prescription Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: prescriptionId
 *         required: true
 *         schema:
 *           type: string
 *           example: "RX_260317_a1b2c3d4"
 *         description: ID đơn thuốc
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancelled_reason:
 *                 type: string
 *                 example: "Bệnh nhân từ chối dùng thuốc"
 *                 description: "Bắt buộc nếu đơn đang PRESCRIBED"
 *     responses:
 *       200:
 *         description: Hủy đơn thuốc thành công
 *       400:
 *         description: |
 *           - Không thể hủy đơn ở trạng thái hiện tại
 *           - Thiếu lý do hủy (khi đơn đã xác nhận)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn thuốc
 */
prescriptionRoutes.patch(
    '/:prescriptionId/cancel',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_PRESCRIPTION_EDIT'),
    PrescriptionController.cancel
);

// =====================================================================
// DÒNG THUỐC (DETAILS)
// =====================================================================

/**
 * @swagger
 * /api/prescriptions/{prescriptionId}/details:
 *   post:
 *     summary: Thêm dòng thuốc vào đơn
 *     description: |
 *       Thêm 1 dòng thuốc mới vào đơn thuốc đang **DRAFT**.
 *       Bao gồm: thuốc, số lượng, liều dùng, tần suất, số ngày, cách dùng, đường dùng.
 *       Thuốc phải tồn tại trong Master Data và đang active.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `EMR_PRESCRIPTION_EDIT`).
 *     tags:
 *       - "4.5 Prescription Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: prescriptionId
 *         required: true
 *         schema:
 *           type: string
 *           example: "RX_260317_a1b2c3d4"
 *         description: ID đơn thuốc
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [drug_id, quantity, dosage, frequency]
 *             properties:
 *               drug_id:
 *                 type: string
 *                 example: "DRG_AMLODIPIN_5"
 *                 description: "ID thuốc (từ bảng drugs)"
 *               quantity:
 *                 type: integer
 *                 example: 30
 *                 description: "Số lượng thuốc"
 *               dosage:
 *                 type: string
 *                 example: "5mg"
 *                 description: "Liều dùng mỗi lần"
 *               frequency:
 *                 type: string
 *                 example: "1 lần/ngày (sáng)"
 *                 description: "Tần suất dùng thuốc"
 *               duration_days:
 *                 type: integer
 *                 example: 30
 *                 description: "Số ngày dùng (optional)"
 *               usage_instruction:
 *                 type: string
 *                 example: "Uống sau ăn sáng"
 *                 description: "Hướng dẫn sử dụng chi tiết"
 *               route_of_administration:
 *                 type: string
 *                 enum: [ORAL, INJECTION, TOPICAL, INHALATION, SUBLINGUAL, RECTAL, OPHTHALMIC, OTIC, NASAL, OTHER]
 *                 example: "ORAL"
 *                 description: "Đường dùng thuốc"
 *               notes:
 *                 type: string
 *                 example: "Theo dõi HA hàng ngày"
 *                 description: "Ghi chú BS cho dòng thuốc"
 *     responses:
 *       201:
 *         description: Thêm dòng thuốc thành công
 *       400:
 *         description: |
 *           - Đơn thuốc không ở trạng thái DRAFT
 *           - Thiếu thông tin bắt buộc
 *           - Đường dùng thuốc không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn thuốc hoặc thuốc không tồn tại
 */
prescriptionRoutes.post(
    '/:prescriptionId/details',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_PRESCRIPTION_EDIT'),
    PrescriptionController.addDetail
);

/**
 * @swagger
 * /api/prescriptions/{prescriptionId}/details:
 *   get:
 *     summary: Lấy danh sách dòng thuốc trong đơn
 *     description: |
 *       Trả về danh sách tất cả dòng thuốc đang active trong đơn thuốc,
 *       kèm thông tin thuốc (tên, mã, hoạt chất, đơn vị cấp phát).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST (ai có quyền `EMR_PRESCRIPTION_VIEW`).
 *     tags:
 *       - "4.5 Prescription Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: prescriptionId
 *         required: true
 *         schema:
 *           type: string
 *           example: "RX_260317_a1b2c3d4"
 *         description: ID đơn thuốc
 *     responses:
 *       200:
 *         description: Lấy danh sách dòng thuốc thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn thuốc
 */
prescriptionRoutes.get(
    '/:prescriptionId/details',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_PRESCRIPTION_VIEW'),
    PrescriptionController.getDetails
);
