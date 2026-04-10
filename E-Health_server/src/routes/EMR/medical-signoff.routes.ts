import { Router } from 'express';
import { SignOffController } from '../../controllers/EMR/medical-signoff.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const signOffRoutes = Router();

// =====================================================================
// ĐẶT TRƯỚC PARAM ROUTES
// =====================================================================

/**
 * @swagger
 * /api/sign-off/by-doctor/pending:
 *   get:
 *     summary: DS encounter chờ ký của BS đang login
 *     description: |
 *       Lấy danh sách encounter đã COMPLETED nhưng chưa có chữ ký OFFICIAL của bác sĩ đang đăng nhập.
 *       Dashboard "cần ký" — giúp BS biết encounter nào cần xử lý.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `EMR_SIGNOFF_DRAFT`).
 *     tags:
 *       - "4.8 Medical Sign-off"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
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
 *                       encounters_id:
 *                         type: string
 *                         example: "ENC_260316_a60a783f"
 *                       encounter_type:
 *                         type: string
 *                         example: "FIRST_VISIT"
 *                       patient_name:
 *                         type: string
 *                         example: "Trần Đức Minh"
 *                       has_draft_sign:
 *                         type: boolean
 *                       has_official_sign:
 *                         type: boolean
 *                       completeness_status:
 *                         type: string
 *                         enum: [READY_TO_SIGN, NEEDS_FINALIZE, NOT_COMPLETED]
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 */
signOffRoutes.get(
    '/by-doctor/pending',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_SIGNOFF_DRAFT'),
    SignOffController.getPending
);

// =====================================================================
// XÁC NHẬN HOÀN TẤT KHÁM
// =====================================================================

/**
 * @swagger
 * /api/sign-off/{encounterId}/complete:
 *   patch:
 *     summary: Xác nhận hoàn tất khám
 *     description: |
 *       Chuyển encounter từ IN_PROGRESS / WAITING_FOR_RESULTS → COMPLETED.
 *       Kiểm tra completeness tối thiểu và quyền BS phụ trách.
 *       Ghi audit log + timeline event.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `EMR_SIGNOFF_COMPLETE`).
 *     tags:
 *       - "4.8 Medical Sign-off"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_a60a783f"
 *         description: ID lượt khám
 *     responses:
 *       200:
 *         description: Xác nhận hoàn tất thành công
 *       400:
 *         description: Encounter không ở trạng thái cho phép / completeness quá thấp
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không phải BS phụ trách
 *       404:
 *         description: Encounter không tồn tại
 */
signOffRoutes.patch(
    '/:encounterId/complete',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_SIGNOFF_COMPLETE'),
    SignOffController.completeEncounter
);

// =====================================================================
// KÝ SỐ
// =====================================================================

/**
 * @swagger
 * /api/sign-off/{encounterId}/draft-sign:
 *   post:
 *     summary: Ký nháp hồ sơ
 *     description: |
 *       BS ký nháp = "Tôi đã xem qua hồ sơ này". **Không khóa chỉnh sửa**.
 *       Tạo hash SHA-256 từ data hiện tại. Có thể ký nháp nhiều lần.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `EMR_SIGNOFF_DRAFT`).
 *     tags:
 *       - "4.8 Medical Sign-off"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_a60a783f"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sign_scope:
 *                 type: string
 *                 enum: [ENCOUNTER, CLINICAL_EXAM, DIAGNOSIS, PRESCRIPTION, MEDICAL_ORDER]
 *                 example: "ENCOUNTER"
 *                 description: Phạm vi ký (mặc định ENCOUNTER)
 *               notes:
 *                 type: string
 *                 example: "Đã xem qua hồ sơ, cần bổ sung XN máu"
 *               certificate_serial:
 *                 type: string
 *                 example: "SN-2026-001"
 *     responses:
 *       201:
 *         description: Ký nháp thành công
 *       400:
 *         description: Encounter chưa hoàn tất (COMPLETED)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Encounter không tồn tại
 */
signOffRoutes.post(
    '/:encounterId/draft-sign',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_SIGNOFF_DRAFT'),
    SignOffController.draftSign
);

/**
 * @swagger
 * /api/sign-off/{encounterId}/official-sign:
 *   post:
 *     summary: Ký chính thức hồ sơ
 *     description: |
 *       Ký chính thức = "Tôi xác nhận hồ sơ chính xác, **KHÓA** chỉnh sửa".
 *       - Encounter **PHẢI đã finalized** (4.6) trước khi ký.
 *       - Hash từ snapshot (bất biến).
 *       - Sau khi ký: mọi API sửa/xóa data thuộc scope bị CHẶN.
 *       - Mỗi scope chỉ cho phép 1 chữ ký OFFICIAL chưa bị thu hồi.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR (ai có quyền `EMR_RECORD_SIGN`).
 *     tags:
 *       - "4.8 Medical Sign-off"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_a60a783f"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sign_scope:
 *                 type: string
 *                 enum: [ENCOUNTER, CLINICAL_EXAM, DIAGNOSIS, PRESCRIPTION, MEDICAL_ORDER]
 *                 example: "ENCOUNTER"
 *               notes:
 *                 type: string
 *                 example: "Xác nhận hồ sơ hoàn chỉnh"
 *               certificate_serial:
 *                 type: string
 *                 example: "SN-2026-001"
 *     responses:
 *       201:
 *         description: Ký chính thức thành công — dữ liệu đã khóa
 *       400:
 *         description: Chưa finalize / scope không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền
 *       404:
 *         description: Encounter / snapshot không tồn tại
 *       409:
 *         description: Scope đã có chữ ký chính thức chưa bị thu hồi
 */
signOffRoutes.post(
    '/:encounterId/official-sign',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_RECORD_SIGN'),
    SignOffController.officialSign
);

/**
 * @swagger
 * /api/sign-off/{encounterId}/revoke:
 *   post:
 *     summary: Thu hồi chữ ký
 *     description: |
 *       Chỉ ADMIN có quyền thu hồi. Phải có lý do.
 *       Không xóa record, chỉ đánh dấu `is_revoked = TRUE`.
 *       Nếu chữ ký OFFICIAL bị revoke → dữ liệu được mở khóa lại.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** Chỉ ADMIN (ai có quyền `EMR_SIGNOFF_REVOKE`).
 *     tags:
 *       - "4.8 Medical Sign-off"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_a60a783f"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [signature_id, reason]
 *             properties:
 *               signature_id:
 *                 type: string
 *                 example: "SIG_a1b2c3d4e5f6"
 *               reason:
 *                 type: string
 *                 example: "Phát hiện sai tên thuốc trong đơn, cần chỉnh lại"
 *     responses:
 *       200:
 *         description: Thu hồi thành công
 *       400:
 *         description: Thiếu thông tin
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không phải ADMIN
 *       404:
 *         description: Chữ ký không tồn tại
 *       409:
 *         description: Chữ ký đã bị thu hồi trước đó
 */
signOffRoutes.post(
    '/:encounterId/revoke',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_SIGNOFF_REVOKE'),
    SignOffController.revoke
);

// =====================================================================
// XEM & XÁC MINH
// =====================================================================

/**
 * @swagger
 * /api/sign-off/{encounterId}/signatures:
 *   get:
 *     summary: Danh sách chữ ký của encounter
 *     description: |
 *       Lấy tất cả chữ ký (DRAFT + OFFICIAL) kèm tên người ký, trạng thái revoke.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST (ai có quyền `EMR_RECORD_VIEW`).
 *     tags:
 *       - "4.8 Medical Sign-off"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_a60a783f"
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Encounter không tồn tại
 */
signOffRoutes.get(
    '/:encounterId/signatures',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_RECORD_VIEW'),
    SignOffController.getSignatures
);

/**
 * @swagger
 * /api/sign-off/{encounterId}/verify:
 *   get:
 *     summary: Xác minh tính toàn vẹn hồ sơ
 *     description: |
 *       So sánh hash hiện tại (từ snapshot) với hash lúc ký chính thức.
 *       Nếu hash không khớp → dữ liệu đã bị thay đổi trái phép.
 *       Ghi audit log: `INTEGRITY_VERIFIED`.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST (ai có quyền `EMR_RECORD_VIEW`).
 *     tags:
 *       - "4.8 Medical Sign-off"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_a60a783f"
 *     responses:
 *       200:
 *         description: Xác minh thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 is_valid:
 *                   type: boolean
 *                   example: true
 *                 signatures:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       sign_scope:
 *                         type: string
 *                       original_hash:
 *                         type: string
 *                       current_hash:
 *                         type: string
 *                       is_match:
 *                         type: boolean
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Encounter không tồn tại
 */
signOffRoutes.get(
    '/:encounterId/verify',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_RECORD_VIEW'),
    SignOffController.verify
);

/**
 * @swagger
 * /api/sign-off/{encounterId}/audit-log:
 *   get:
 *     summary: Lịch sử hành động ký
 *     description: |
 *       Audit trail theo thứ tự thời gian:
 *       ENCOUNTER_COMPLETED → DRAFT_SIGNED → OFFICIAL_SIGNED → SIGN_REVOKED ...
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE (ai có quyền `EMR_RECORD_VIEW`).
 *     tags:
 *       - "4.8 Medical Sign-off"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_a60a783f"
 *     responses:
 *       200:
 *         description: Lấy lịch sử thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Encounter không tồn tại
 */
signOffRoutes.get(
    '/:encounterId/audit-log',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_RECORD_VIEW'),
    SignOffController.getAuditLog
);

/**
 * @swagger
 * /api/sign-off/{encounterId}/lock-status:
 *   get:
 *     summary: Trạng thái khóa chỉnh sửa
 *     description: |
 *       Trả về trạng thái khóa của từng scope. Nếu scope ENCOUNTER bị lock → tất cả scope con cũng lock.
 *       Frontend dùng API này để disabled nút edit khi hồ sơ đã ký chính thức.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, DOCTOR, NURSE, PHARMACIST (ai có quyền `EMR_RECORD_VIEW`).
 *     tags:
 *       - "4.8 Medical Sign-off"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: encounterId
 *         required: true
 *         schema:
 *           type: string
 *           example: "ENC_260316_a60a783f"
 *     responses:
 *       200:
 *         description: Lấy trạng thái thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 is_finalized:
 *                   type: boolean
 *                 is_officially_signed:
 *                   type: boolean
 *                 locked_scopes:
 *                   type: object
 *                   properties:
 *                     ENCOUNTER:
 *                       type: boolean
 *                     CLINICAL_EXAM:
 *                       type: boolean
 *                     DIAGNOSIS:
 *                       type: boolean
 *                     PRESCRIPTION:
 *                       type: boolean
 *                     MEDICAL_ORDER:
 *                       type: boolean
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Encounter không tồn tại
 */
signOffRoutes.get(
    '/:encounterId/lock-status',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('EMR_RECORD_VIEW'),
    SignOffController.getLockStatus
);
