import { Router } from 'express';
import { AuditLogController } from '../../controllers/Core/audit-log.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const auditLogRoutes = Router();

// Toàn bộ chức năng Tra cứu Log bị siết chặt, chỉ có Role System Admin hoặc Super Admin mới được vao
auditLogRoutes.use(verifyAccessToken);
auditLogRoutes.use(checkSessionStatus);
auditLogRoutes.use(authorizePermissions('AUDIT_LOG_VIEW', 'AUDIT_LOG_EXPORT'));

/**
 * @swagger
 * tags:
 *   name: 1.8 Quản lý Nhật ký hệ thống (Audit Logs)
 *   description: Tracking API Mọi thao tác POST/PUT/DELETE
 */

/**
 * @swagger
 * /api/system/audit-logs/export-excel:
 *   get:
 *     summary: Xuất file Excel toàn bộ lịch sử thao tác
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *     tags: [1.8 Quản lý Nhật ký hệ thống (Audit Logs)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: "Lọc theo Mã nhân viên / User"
 *         example: "USR_123"
 *       - in: query
 *         name: module_name
 *         schema:
 *           type: string
 *         description: "Lọc theo module (VD: PATIENT, DRUG, APPOINTMENT, FACILITY)"
 *         example: ""
 *       - in: query
 *         name: action_type
 *         schema:
 *           type: string
 *         description: "Lọc theo Hành động (CREATE, UPDATE, DELETE, LOGIN)"
 *         example: "UPDATE"
 *     responses:
 *        200:
 *          description: Trả về file Blob Excel
 */
auditLogRoutes.get('/export-excel', AuditLogController.exportExcel);

/**
 * @swagger
 * /api/system/audit-logs:
 *   get:
 *     summary: Tra cứu danh sách Audit Logs
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *     tags: [1.8 Quản lý Nhật ký hệ thống (Audit Logs)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Số trang"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: "Số lượng / trang"
 *       - in: query
 *         name: module_name
 *         schema:
 *           type: string
 *         description: "Lọc theo Module"
 *         example: "PATIENT"
 *       - in: query
 *         name: action_type
 *         schema:
 *           type: string
 *         description: "Lọc theo loại thao tác"
 *         example: "UPDATE"
 *     responses:
 *        200:
 *          description: Trả về thông tin
 */
auditLogRoutes.get('/', AuditLogController.getLogs);

/**
 * @swagger
 * /api/system/audit-logs/{id}:
 *   get:
 *     summary: Xem chi tiết 1 dòng Log để Validate Before/After
 *     description: |
 *       **Vai trò được phép:** Tất cả thành viên đã đăng nhập
 *
 *     tags: [1.8 Quản lý Nhật ký hệ thống (Audit Logs)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *        200:
 *          description: Trả về thông tin
 */
auditLogRoutes.get('/:id', AuditLogController.getLogById);

export default auditLogRoutes;
