import { Router } from 'express';
import { DispensingController } from '../../controllers/Medication Management/dispensing.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

export const dispensingRoutes = Router();

// =====================================================================
// HỖ TRỢ (đặt trước để tránh conflict với :prescriptionId param)
// 

/**
 * @swagger
 * /api/dispensing/history:
 *   get:
 *     summary: Lịch sử cấp phát thuốc
 *     description: |
 *       Lấy danh sách tất cả phiếu cấp phát thuốc, hỗ trợ phân trang và lọc.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST, DOCTOR, NURSE (ai có quyền `DISPENSING_VIEW`).
 *     tags:
 *       - "5.5 Dispensing Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           enum: [COMPLETED, CANCELLED]
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
 *         description: Lấy lịch sử cấp phát thành công
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
 *                   example: "Lấy lịch sử cấp phát thành công"
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
 */
dispensingRoutes.get(
    '/history',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('DISPENSING_VIEW'),
    DispensingController.getHistory
);

/**
 * @swagger
 * /api/dispensing/inventory/{drugId}:
 *   get:
 *     summary: Xem tồn kho theo thuốc (FEFO)
 *     description: |
 *       Lấy danh sách tất cả các lô tồn kho còn hàng và chưa hết hạn của một thuốc.
 *       Sắp xếp theo FEFO (First Expired, First Out) — lô hết hạn sớm nhất trước.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST, DOCTOR, NURSE (ai có quyền `DISPENSING_VIEW`).
 *     tags:
 *       - "5.5 Dispensing Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: drugId
 *         required: true
 *         schema:
 *           type: string
 *           example: "DRG_001"
 *         description: ID thuốc (drugs_id)
 *     responses:
 *       200:
 *         description: Lấy tồn kho thành công
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
 *                       pharmacy_inventory_id:
 *                         type: string
 *                       batch_number:
 *                         type: string
 *                       expiry_date:
 *                         type: string
 *                       stock_quantity:
 *                         type: integer
 *                       unit_price:
 *                         type: number
 *                       location_bin:
 *                         type: string
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Thuốc không tồn tại
 */
dispensingRoutes.get(
    '/inventory/:drugId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('DISPENSING_VIEW'),
    DispensingController.getInventory
);

/**
 * @swagger
 * /api/dispensing/inventory/{drugId}/check:
 *   get:
 *     summary: Kiểm tra tồn kho đủ số lượng
 *     description: |
 *       Kiểm tra xem tổng tồn kho (tất cả lô còn hàng, chưa hết hạn) có đủ
 *       cho số lượng yêu cầu hay không. Trả kèm danh sách lô có thể dùng.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST, DOCTOR, NURSE (ai có quyền `DISPENSING_VIEW`).
 *     tags:
 *       - "5.5 Dispensing Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: drugId
 *         required: true
 *         schema:
 *           type: string
 *           example: "DRG_001"
 *         description: ID thuốc
 *       - in: query
 *         name: quantity
 *         required: true
 *         schema:
 *           type: integer
 *           example: 30
 *         description: Số lượng cần kiểm tra
 *     responses:
 *       200:
 *         description: Kiểm tra tồn kho thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     drug_id:
 *                       type: string
 *                     requested_quantity:
 *                       type: integer
 *                     total_available:
 *                       type: integer
 *                     is_sufficient:
 *                       type: boolean
 *                     batches:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Thuốc không tồn tại
 */
dispensingRoutes.get(
    '/inventory/:drugId/check',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('DISPENSING_VIEW'),
    DispensingController.checkStock
);

/**
 * @swagger
 * /api/dispensing/by-pharmacist/{pharmacistId}:
 *   get:
 *     summary: Lịch sử cấp phát theo dược sĩ
 *     description: |
 *       Lấy danh sách phiếu cấp phát mà dược sĩ đã thực hiện, hỗ trợ phân trang.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `DISPENSING_VIEW`).
 *     tags:
 *       - "5.5 Dispensing Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pharmacistId
 *         required: true
 *         schema:
 *           type: string
 *           example: "USR_0001"
 *         description: ID dược sĩ (users_id)
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
 *         description: Lấy lịch sử thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Dược sĩ không tồn tại
 */
dispensingRoutes.get(
    '/by-pharmacist/:pharmacistId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('DISPENSING_VIEW'),
    DispensingController.getByPharmacist
);

// =====================================================================
// CẤP PHÁT THEO ĐƠN THUỐC
// =====================================================================

/**
 * @swagger
 * /api/dispensing/{prescriptionId}:
 *   post:
 *     summary: Tạo phiếu cấp phát thuốc
 *     description: |
 *       Tạo phiếu cấp phát từ đơn thuốc đã xác nhận (PRESCRIBED).
 *       Thực hiện trong **1 transaction**: tạo phiếu → tạo chi tiết → trừ tồn kho → đổi trạng thái đơn thuốc sang DISPENSED.
 *
 *       **Điều kiện:**
 *       - Đơn thuốc phải ở trạng thái PRESCRIBED
 *       - Mỗi đơn chỉ cấp phát 1 lần
 *       - Tồn kho phải đủ, lô chưa hết hạn
 *       - Drug ID của lô kho phải khớp với dòng thuốc trong đơn
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `DISPENSING_CREATE`).
 *     tags:
 *       - "5.5 Dispensing Management"
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
 *             required: [items]
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "BN nhận thuốc trực tiếp tại quầy"
 *                 description: Ghi chú dược sĩ (tuỳ chọn)
 *               items:
 *                 type: array
 *                 description: Danh sách dòng thuốc cần cấp phát
 *                 items:
 *                   type: object
 *                   required: [prescription_detail_id, inventory_id, dispensed_quantity]
 *                   properties:
 *                     prescription_detail_id:
 *                       type: string
 *                       example: "RXD_260317_a1b2c3d4"
 *                       description: ID dòng thuốc trong đơn
 *                     inventory_id:
 *                       type: string
 *                       example: "PINV_0001"
 *                       description: ID lô tồn kho
 *                     dispensed_quantity:
 *                       type: integer
 *                       example: 30
 *                       description: Số lượng cấp phát
 *     responses:
 *       201:
 *         description: Cấp phát thuốc thành công
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
 *                   example: "Cấp phát thuốc thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total_items:
 *                       type: integer
 *                     total_cost:
 *                       type: number
 *       400:
 *         description: |
 *           - Đơn thuốc chưa xác nhận
 *           - Tồn kho không đủ
 *           - Lô thuốc hết hạn
 *           - Drug mismatch
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Đơn thuốc / dòng thuốc / lô kho không tồn tại
 *       409:
 *         description: Đơn thuốc đã được cấp phát rồi
 */
dispensingRoutes.post(
    '/:prescriptionId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('DISPENSING_CREATE'),
    DispensingController.dispense
);

/**
 * @swagger
 * /api/dispensing/{prescriptionId}:
 *   get:
 *     summary: Xem phiếu cấp phát theo đơn thuốc
 *     description: |
 *       Trả về phiếu cấp phát (header) và danh sách dòng thuốc chi tiết.
 *       Nếu đơn chưa cấp phát, data trả về null.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST, DOCTOR, NURSE (ai có quyền `DISPENSING_VIEW`).
 *     tags:
 *       - "5.5 Dispensing Management"
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
 *         description: Lấy phiếu cấp phát thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Đơn thuốc không tồn tại
 */
dispensingRoutes.get(
    '/:prescriptionId',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('DISPENSING_VIEW'),
    DispensingController.getByPrescription
);

// =====================================================================
// HỦY PHIẾU CẤP PHÁT
// =====================================================================

/**
 * @swagger
 * /api/dispensing/{dispenseOrderId}/cancel:
 *   post:
 *     summary: Hủy phiếu cấp phát + hoàn kho
 *     description: |
 *       Hủy phiếu cấp phát: hoàn tồn kho cho tất cả lô đã trừ,
 *       đổi trạng thái đơn thuốc từ DISPENSED về PRESCRIBED.
 *       Bắt buộc nhập lý do hủy.
 *
 *       **Phân quyền:** Yêu cầu đăng nhập + session hợp lệ.
 *       **Vai trò được phép:** ADMIN, PHARMACIST (ai có quyền `DISPENSING_CREATE`).
 *     tags:
 *       - "5.5 Dispensing Management"
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dispenseOrderId
 *         required: true
 *         schema:
 *           type: string
 *           example: "DSO_260317_a1b2c3d4"
 *         description: ID phiếu cấp phát
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cancelled_reason]
 *             properties:
 *               cancelled_reason:
 *                 type: string
 *                 example: "Bệnh nhân từ chối nhận thuốc"
 *                 description: Lý do hủy (bắt buộc)
 *     responses:
 *       200:
 *         description: Hủy phiếu cấp phát và hoàn kho thành công
 *       400:
 *         description: |
 *           - Phiếu đã bị hủy trước đó
 *           - Thiếu lý do hủy
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy phiếu cấp phát
 */
dispensingRoutes.post(
    '/:dispenseOrderId/cancel',
    verifyAccessToken,
    checkSessionStatus,
    authorizePermissions('DISPENSING_CREATE'),
    DispensingController.cancel
);
