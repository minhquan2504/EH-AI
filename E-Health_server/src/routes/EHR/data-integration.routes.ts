import { Router } from 'express';
import { DataIntegrationController } from '../../controllers/EHR/data-integration.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

export const dataIntegrationRoutes = Router();

// ==================== DATA SOURCES ====================

/**
 * @swagger
 * /api/ehr/patients/{patientId}/data-sources:
 *   get:
 *     summary: Danh sách nguồn dữ liệu
 *     description: |
 *       Lấy tất cả nguồn dữ liệu đã cấu hình (bệnh viện, phòng XN, bảo hiểm, thiết bị).
 *       Dùng chung cho toàn hệ thống, không filter theo patient.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *     tags: ["6.8 Data Integration"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *     responses:
 *       200: { description: Lấy danh sách thành công }
 *   post:
 *     summary: Thêm nguồn dữ liệu mới
 *     description: |
 *       Đăng ký nguồn dữ liệu bên ngoài: bệnh viện liên kết, phòng xét nghiệm,
 *       nhà bảo hiểm, thiết bị y tế.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *     tags: ["6.8 Data Integration"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [source_name, source_type]
 *             properties:
 *               source_name:
 *                 type: string
 *                 example: "Bệnh viện Đa khoa Trung ương"
 *               source_type:
 *                 type: string
 *                 enum: [HOSPITAL, LAB, INSURANCE, DEVICE, OTHER]
 *                 example: "HOSPITAL"
 *               protocol:
 *                 type: string
 *                 enum: [REST_API, HL7_FHIR, SOAP, MANUAL]
 *                 example: "HL7_FHIR"
 *               endpoint_url:
 *                 type: string
 *                 example: "https://bvdk.example.com/api/fhir"
 *               contact_info:
 *                 type: string
 *                 example: "028-1234-5678"
 *               description:
 *                 type: string
 *                 example: "Bệnh viện tuyến trên liên kết chuyển viện"
 *     responses:
 *       201: { description: Tạo thành công }
 *       400: { description: Thiếu thông tin bắt buộc }
 */
dataIntegrationRoutes.get(
    '/patients/:patientId/data-sources',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    DataIntegrationController.getDataSources
);

dataIntegrationRoutes.post(
    '/patients/:patientId/data-sources',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR'),
    DataIntegrationController.createDataSource
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/data-sources/{sourceId}:
 *   patch:
 *     summary: Cập nhật nguồn dữ liệu
 *     description: |
 *       Cập nhật thông tin nguồn (tên, endpoint, trạng thái active...).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *     tags: ["6.8 Data Integration"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: path
 *         name: sourceId
 *         required: true
 *         schema: { type: string, example: "SRC_260318_abc12345" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               source_name:
 *                 type: string
 *                 example: "PK Đa khoa ABC (cập nhật)"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *               description:
 *                 type: string
 *                 example: "Đã ký hợp đồng liên kết"
 *     responses:
 *       200: { description: Cập nhật thành công }
 *       404: { description: Nguồn không tồn tại }
 */
dataIntegrationRoutes.patch(
    '/patients/:patientId/data-sources/:sourceId',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR'),
    DataIntegrationController.updateDataSource
);

// ==================== EXTERNAL RECORDS ====================

/**
 * @swagger
 * /api/ehr/patients/{patientId}/external-records:
 *   get:
 *     summary: Danh sách hồ sơ bên ngoài
 *     description: |
 *       DS hồ sơ nhập từ bên ngoài (bệnh viện khác, bảo hiểm, XN...).
 *       Filter: data_type, sync_status, source_id, khoảng ngày.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *     tags: ["6.8 Data Integration"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: query
 *         name: data_type
 *         schema: { type: string, enum: [VACCINE_CERT, LAB_HISTORY, IMAGING, INSURANCE_CLAIM, DISCHARGE_SUMMARY, REFERRAL, OTHER], example: "" }
 *       - in: query
 *         name: sync_status
 *         schema: { type: string, enum: [PENDING, PROCESSED, FAILED], example: "" }
 *       - in: query
 *         name: source_id
 *         schema: { type: string, example: "" }
 *       - in: query
 *         name: from_date
 *         schema: { type: string, format: date, example: "" }
 *       - in: query
 *         name: to_date
 *         schema: { type: string, format: date, example: "" }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *     responses:
 *       200: { description: Lấy danh sách thành công }
 *       404: { description: Bệnh nhân không tồn tại }
 *   post:
 *     summary: Nhập hồ sơ bên ngoài (JSON / HL7 FHIR)
 *     description: |
 *       Nhập dữ liệu y tế từ bên ngoài. raw_payload là JSONB chứa toàn bộ dữ liệu gốc.
 *       Hỗ trợ: VACCINE_CERT, LAB_HISTORY, IMAGING, INSURANCE_CLAIM, DISCHARGE_SUMMARY, REFERRAL.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.8 Data Integration"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [provider_name, raw_payload]
 *             properties:
 *               provider_name:
 *                 type: string
 *                 example: "Bệnh viện Chợ Rẫy"
 *               integration_protocol:
 *                 type: string
 *                 example: "HL7_FHIR"
 *               data_type:
 *                 type: string
 *                 example: "LAB_HISTORY"
 *               raw_payload:
 *                 type: object
 *                 example: { "resourceType": "DiagnosticReport", "status": "final", "code": { "text": "Xét nghiệm máu tổng quát" }, "result": [{ "display": "WBC", "value": 8.5, "unit": "10^3/uL" }] }
 *               source_id:
 *                 type: string
 *                 example: ""
 *     responses:
 *       201: { description: Nhập hồ sơ thành công }
 *       400: { description: Thiếu thông tin bắt buộc }
 *       404: { description: Bệnh nhân không tồn tại }
 */
dataIntegrationRoutes.get(
    '/patients/:patientId/external-records',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    DataIntegrationController.getExternalRecords
);

dataIntegrationRoutes.post(
    '/patients/:patientId/external-records',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    DataIntegrationController.createExternalRecord
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/external-records/{recordId}:
 *   get:
 *     summary: Chi tiết hồ sơ bên ngoài
 *     description: |
 *       Xem chi tiết 1 hồ sơ: metadata + raw_payload (parsed JSON).
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.8 Data Integration"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema: { type: string, example: "EHR_260318_abc12345" }
 *     responses:
 *       200: { description: Lấy chi tiết thành công }
 *       403: { description: Hồ sơ không thuộc bệnh nhân }
 *       404: { description: Không tìm thấy }
 */
dataIntegrationRoutes.get(
    '/patients/:patientId/external-records/:recordId',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    DataIntegrationController.getExternalRecordDetail
);

/**
 * @swagger
 * /api/ehr/patients/{patientId}/external-records/{recordId}/status:
 *   patch:
 *     summary: Cập nhật trạng thái sync
 *     description: |
 *       Chuyển trạng thái: PENDING → PROCESSED (đã xử lý) hoặc PENDING → FAILED (lỗi).
 *       Nếu FAILED thì ghi error_message.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR.
 *     tags: ["6.8 Data Integration"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema: { type: string, example: "EHR_260318_abc12345" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sync_status]
 *             properties:
 *               sync_status:
 *                 type: string
 *                 enum: [PROCESSED, FAILED]
 *                 example: "PROCESSED"
 *               error_message:
 *                 type: string
 *                 example: ""
 *     responses:
 *       200: { description: Cập nhật thành công }
 *       400: { description: Trạng thái không hợp lệ }
 *       403: { description: Hồ sơ không thuộc bệnh nhân }
 *       404: { description: Không tìm thấy }
 */
dataIntegrationRoutes.patch(
    '/patients/:patientId/external-records/:recordId/status',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR'),
    DataIntegrationController.updateSyncStatus
);

// ==================== DEVICE SYNC ====================

/**
 * @swagger
 * /api/ehr/patients/{patientId}/device-sync:
 *   post:
 *     summary: Log đồng bộ thiết bị y tế
 *     description: |
 *       Ghi log mỗi lần đồng bộ thiết bị y tế (máy đo HA, đường huyết, SpO2...).
 *       Liên kết source_id nếu thiết bị đã đăng ký nguồn.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.8 Data Integration"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [device_name]
 *             properties:
 *               device_name:
 *                 type: string
 *                 example: "Máy đo huyết áp Omron HEM-7124"
 *               device_type:
 *                 type: string
 *                 example: "BLOOD_PRESSURE_MONITOR"
 *               source_id:
 *                 type: string
 *                 example: ""
 *               records_synced:
 *                 type: integer
 *                 example: 5
 *               status:
 *                 type: string
 *                 enum: [SUCCESS, PARTIAL, FAILED]
 *                 example: "SUCCESS"
 *               error_message:
 *                 type: string
 *                 example: ""
 *     responses:
 *       201: { description: Ghi log thành công }
 *       400: { description: Thiếu tên thiết bị }
 *       404: { description: Bệnh nhân không tồn tại }
 *   get:
 *     summary: Lịch sử đồng bộ thiết bị
 *     description: |
 *       Xem lịch sử các lần đồng bộ thiết bị y tế cho bệnh nhân.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE.
 *     tags: ["6.8 Data Integration"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *     responses:
 *       200: { description: Lấy lịch sử thành công }
 *       404: { description: Bệnh nhân không tồn tại }
 */
dataIntegrationRoutes.post(
    '/patients/:patientId/device-sync',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    DataIntegrationController.createDeviceSyncLog
);

dataIntegrationRoutes.get(
    '/patients/:patientId/device-sync',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE'),
    DataIntegrationController.getDeviceSyncLogs
);

// ==================== SUMMARY ====================

/**
 * @swagger
 * /api/ehr/patients/{patientId}/integration-summary:
 *   get:
 *     summary: Dashboard tổng hợp tích hợp
 *     description: |
 *       Tổng hợp: số nguồn (active/total), số hồ sơ bên ngoài (theo status, data_type, source_type),
 *       số lần sync thiết bị, lần sync gần nhất.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, STAFF.
 *     tags: ["6.8 Data Integration"]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string, example: "PAT_001" }
 *     responses:
 *       200: { description: Lấy dashboard thành công }
 *       404: { description: Bệnh nhân không tồn tại }
 */
dataIntegrationRoutes.get(
    '/patients/:patientId/integration-summary',
    verifyAccessToken, checkSessionStatus,
    authorizeRoles('ADMIN', 'DOCTOR', 'NURSE', 'STAFF'),
    DataIntegrationController.getIntegrationSummary
);
