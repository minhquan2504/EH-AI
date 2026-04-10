import { Router } from 'express';
import { BillingPricingPolicyController } from '../../controllers/Billing/billing-pricing-policy.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { authorizeRoles } from '../../middleware/authorizeRoles.middleware';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// NHÓM 1: CHÍNH SÁCH GIẢM GIÁ
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/pricing-policies/discounts:
 *   post:
 *     summary: Tạo chính sách giảm giá
 *     description: |
 *       Tạo chính sách giảm giá mới (PERCENTAGE hoặc FIXED_AMOUNT).
 *       Hỗ trợ phạm vi: ALL_SERVICES, SPECIFIC_SERVICES, SERVICE_GROUP.
 *       Hỗ trợ đối tượng: VIP, ELDERLY, INSURANCE, ...
 *       Priority cao hơn áp dụng trước.
 *
 *       Phân quyền: BILLING_DISCOUNT_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.8.1 Chính sách giảm giá]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, discount_type, discount_value, effective_from]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Giảm 10% cho người cao tuổi"
 *               description:
 *                 type: string
 *                 example: "Áp dụng cho tất cả dịch vụ khám chữa bệnh"
 *               discount_type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED_AMOUNT]
 *                 example: "PERCENTAGE"
 *               discount_value:
 *                 type: number
 *                 example: 10
 *               max_discount_amount:
 *                 type: number
 *                 description: "Giới hạn tối đa nếu PERCENTAGE"
 *                 example: 500000
 *               min_order_amount:
 *                 type: number
 *                 example: 100000
 *               apply_to:
 *                 type: string
 *                 enum: [ALL_SERVICES, SPECIFIC_SERVICES, SERVICE_GROUP]
 *                 example: "ALL_SERVICES"
 *               applicable_services:
 *                 type: array
 *                 description: "Danh sách dịch vụ cụ thể nếu SPECIFIC_SERVICES"
 *                 items:
 *                   type: object
 *                   properties:
 *                     facility_service_id: { type: string }
 *               applicable_groups:
 *                 type: array
 *                 description: "Nhóm DV nếu SERVICE_GROUP"
 *                 items: { type: string }
 *                 example: ["CONSULTATION","LAB_ORDER"]
 *               target_patient_types:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["ELDERLY"]
 *               effective_from:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-01"
 *               effective_to:
 *                 type: string
 *                 format: date
 *                 example: "2026-12-31"
 *               priority:
 *                 type: integer
 *                 example: 10
 *               facility_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: |
 *           - PPL_003: Loại giảm giá không hợp lệ
 *           - PPL_004: Giá trị giảm <= 0
 *           - PPL_005: % ngoài phạm vi 0.01-100
 */
router.post('/pricing-policies/discounts', verifyAccessToken, authorizeRoles('ADMIN'), BillingPricingPolicyController.createDiscount);

/**
 * @swagger
 * /api/billing/pricing-policies/discounts:
 *   get:
 *     summary: Danh sách chính sách giảm giá
 *     description: |
 *       Phân quyền: BILLING_DISCOUNT_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.8.1 Chính sách giảm giá]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: discount_type
 *         schema: { type: string, enum: [PERCENTAGE, FIXED_AMOUNT] }
 *       - in: query
 *         name: apply_to
 *         schema: { type: string, enum: [ALL_SERVICES, SPECIFIC_SERVICES, SERVICE_GROUP] }
 *       - in: query
 *         name: is_active
 *         schema: { type: string, enum: [true, false] }
 *       - in: query
 *         name: facility_id
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *     responses:
 *       200:
 *         description: Danh sách + phân trang
 */
router.get('/pricing-policies/discounts', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingPricingPolicyController.getDiscounts);

/**
 * @swagger
 * /api/billing/pricing-policies/discounts/calculate:
 *   post:
 *     summary: Tính giảm giá cho danh sách dịch vụ
 *     description: |
 *       Áp tất cả discount eligible theo priority cascade.
 *       Trả về: original → discounts applied → final amount.
 *
 *       Phân quyền: BILLING_DISCOUNT_APPLY
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.8.1 Chính sách giảm giá]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [services]
 *             properties:
 *               services:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     facility_service_id: { type: string, example: "FS_001" }
 *                     amount: { type: number, example: 500000 }
 *               patient_type:
 *                 type: string
 *                 example: "ELDERLY"
 *               facility_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kết quả tính giảm giá
 */
router.post('/pricing-policies/discounts/calculate', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingPricingPolicyController.calculateDiscount);

/**
 * @swagger
 * /api/billing/pricing-policies/discounts/{id}:
 *   get:
 *     summary: Chi tiết chính sách giảm giá
 *     description: |
 *       Phân quyền: BILLING_DISCOUNT_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.8.1 Chính sách giảm giá]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "DSC_abc123" }
 *     responses:
 *       200:
 *         description: Chi tiết
 *       404:
 *         description: Không tìm thấy
 */
router.get('/pricing-policies/discounts/:id', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingPricingPolicyController.getDiscountById);

/**
 * @swagger
 * /api/billing/pricing-policies/discounts/{id}:
 *   put:
 *     summary: Cập nhật chính sách giảm giá
 *     description: |
 *       Phân quyền: BILLING_DISCOUNT_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.8.1 Chính sách giảm giá]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "DSC_abc123" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               discount_value: { type: number }
 *               effective_to: { type: string, format: date }
 *               is_active: { type: boolean }
 *               priority: { type: integer }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/pricing-policies/discounts/:id', verifyAccessToken, authorizeRoles('ADMIN'), BillingPricingPolicyController.updateDiscount);

/**
 * @swagger
 * /api/billing/pricing-policies/discounts/{id}:
 *   delete:
 *     summary: Vô hiệu hóa chính sách giảm giá
 *     description: |
 *       Soft delete (is_active = false).
 *
 *       Phân quyền: BILLING_DISCOUNT_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.8.1 Chính sách giảm giá]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "DSC_abc123" }
 *     responses:
 *       200:
 *         description: Vô hiệu hóa thành công
 */
router.delete('/pricing-policies/discounts/:id', verifyAccessToken, authorizeRoles('ADMIN'), BillingPricingPolicyController.deleteDiscount);

// ═══════════════════════════════════════════════════════════════
// NHÓM 2: VOUCHER / COUPON
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/pricing-policies/vouchers:
 *   post:
 *     summary: Tạo voucher / coupon
 *     description: |
 *       Tạo mã giảm giá với code tùy chỉnh (VD: VN50K, WELCOME10).
 *       max_usage = tổng lượt sử dụng.
 *       max_usage_per_patient = 1 BN dùng tối đa bao nhiêu lần.
 *
 *       Phân quyền: BILLING_VOUCHER_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.8.2 Voucher / Coupon]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [voucher_code, name, discount_type, discount_value, valid_from]
 *             properties:
 *               voucher_code:
 *                 type: string
 *                 example: "WELCOME10"
 *               name:
 *                 type: string
 *                 example: "Giảm 10% cho bệnh nhân mới"
 *               description:
 *                 type: string
 *               discount_type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED_AMOUNT]
 *                 example: "PERCENTAGE"
 *               discount_value:
 *                 type: number
 *                 example: 10
 *               max_discount_amount:
 *                 type: number
 *                 example: 200000
 *               min_order_amount:
 *                 type: number
 *                 example: 100000
 *               max_usage:
 *                 type: integer
 *                 description: "null = unlimited"
 *                 example: 100
 *               max_usage_per_patient:
 *                 type: integer
 *                 example: 1
 *               target_patient_types:
 *                 type: array
 *                 items: { type: string }
 *               valid_from:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-01"
 *               valid_to:
 *                 type: string
 *                 format: date
 *                 example: "2026-06-30"
 *               facility_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: PPL_010 — Mã voucher đã tồn tại
 */
router.post('/pricing-policies/vouchers', verifyAccessToken, authorizeRoles('ADMIN'), BillingPricingPolicyController.createVoucher);

/**
 * @swagger
 * /api/billing/pricing-policies/vouchers:
 *   get:
 *     summary: Danh sách voucher
 *     description: |
 *       Phân quyền: BILLING_VOUCHER_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.8.2 Voucher / Coupon]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema: { type: string, enum: [true, false] }
 *       - in: query
 *         name: facility_id
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *     responses:
 *       200:
 *         description: Danh sách + phân trang
 */
router.get('/pricing-policies/vouchers', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingPricingPolicyController.getVouchers);

/**
 * @swagger
 * /api/billing/pricing-policies/vouchers/validate:
 *   post:
 *     summary: Validate mã voucher
 *     description: |
 *       Check 5 điều kiện:
 *       1. Còn hạn (valid_from ≤ now ≤ valid_to)
 *       2. Chưa hết lượt (current_usage < max_usage)
 *       3. BN chưa dùng quá max_usage_per_patient
 *       4. Đơn tối thiểu (order_amount ≥ min_order_amount)
 *       5. Đúng đối tượng (target_patient_types)
 *
 *       Trả về: thông tin voucher + discount preview (preview số tiền sẽ được giảm).
 *
 *       Phân quyền: BILLING_DISCOUNT_APPLY
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.8.2 Voucher / Coupon]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [voucher_code]
 *             properties:
 *               voucher_code:
 *                 type: string
 *                 example: "WELCOME10"
 *               patient_id:
 *                 type: string
 *               order_amount:
 *                 type: number
 *                 example: 500000
 *               patient_type:
 *                 type: string
 *                 example: "STANDARD"
 *     responses:
 *       200:
 *         description: Voucher hợp lệ + discount preview
 *       400:
 *         description: |
 *           - PPL_011: Hết hạn
 *           - PPL_012: Hết lượt
 *           - PPL_013: BN đã dùng hết lượt
 *           - PPL_014: Chưa đạt min order
 *           - PPL_015: Không đúng đối tượng
 */
router.post('/pricing-policies/vouchers/validate', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingPricingPolicyController.validateVoucher);

/**
 * @swagger
 * /api/billing/pricing-policies/vouchers/redeem:
 *   post:
 *     summary: Sử dụng (redeem) voucher
 *     description: |
 *       Ghi nhận voucher_usage, tăng current_usage,
 *       cập nhật invoice discount_amount + recalc net_amount.
 *
 *       Phân quyền: BILLING_DISCOUNT_APPLY
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.8.2 Voucher / Coupon]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [voucher_code, invoice_id, order_amount]
 *             properties:
 *               voucher_code:
 *                 type: string
 *                 example: "WELCOME10"
 *               invoice_id:
 *                 type: string
 *                 example: "INV_abc123"
 *               patient_id:
 *                 type: string
 *               order_amount:
 *                 type: number
 *                 example: 500000
 *               patient_type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sử dụng thành công
 *       400:
 *         description: Voucher không hợp lệ
 */
router.post('/pricing-policies/vouchers/redeem', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingPricingPolicyController.redeemVoucher);

/**
 * @swagger
 * /api/billing/pricing-policies/vouchers/{id}:
 *   get:
 *     summary: Chi tiết voucher
 *     description: |
 *       Kèm remaining_usage (lượt còn lại).
 *
 *       Phân quyền: BILLING_VOUCHER_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.8.2 Voucher / Coupon]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "VCH_abc123" }
 *     responses:
 *       200:
 *         description: Chi tiết
 *       404:
 *         description: Không tìm thấy
 */
router.get('/pricing-policies/vouchers/:id', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingPricingPolicyController.getVoucherById);

/**
 * @swagger
 * /api/billing/pricing-policies/vouchers/{id}:
 *   put:
 *     summary: Cập nhật voucher
 *     description: |
 *       Phân quyền: BILLING_VOUCHER_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.8.2 Voucher / Coupon]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               discount_value: { type: number }
 *               max_usage: { type: integer }
 *               valid_to: { type: string, format: date }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/pricing-policies/vouchers/:id', verifyAccessToken, authorizeRoles('ADMIN'), BillingPricingPolicyController.updateVoucher);

/**
 * @swagger
 * /api/billing/pricing-policies/vouchers/{id}:
 *   delete:
 *     summary: Vô hiệu hóa voucher
 *     description: |
 *       Phân quyền: BILLING_VOUCHER_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.8.2 Voucher / Coupon]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Vô hiệu hóa thành công
 */
router.delete('/pricing-policies/vouchers/:id', verifyAccessToken, authorizeRoles('ADMIN'), BillingPricingPolicyController.deleteVoucher);

/**
 * @swagger
 * /api/billing/pricing-policies/vouchers/{id}/usage:
 *   get:
 *     summary: Lịch sử sử dụng voucher
 *     description: |
 *       Danh sách lần sử dụng: BN, hóa đơn, số tiền giảm, thời gian.
 *
 *       Phân quyền: BILLING_VOUCHER_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.8.2 Voucher / Coupon]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "VCH_abc123" }
 *     responses:
 *       200:
 *         description: Danh sách usage
 */
router.get('/pricing-policies/vouchers/:id/usage', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingPricingPolicyController.getVoucherUsage);

// ═══════════════════════════════════════════════════════════════
// NHÓM 3: GÓI DỊCH VỤ
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/pricing-policies/bundles:
 *   post:
 *     summary: Tạo gói dịch vụ combo
 *     description: |
 *       Combo nhiều dịch vụ = 1 gói giá rẻ hơn.
 *       Auto-calc: original_total_price (tổng giá lẻ), discount_percentage (% tiết kiệm).
 *       unit_price tự lấy từ facility_services.base_price.
 *
 *       Phân quyền: BILLING_BUNDLE_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.8.3 Gói dịch vụ]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bundle_code, name, bundle_price, valid_from, items]
 *             properties:
 *               bundle_code:
 *                 type: string
 *                 example: "BDL-KHAMTQ"
 *               name:
 *                 type: string
 *                 example: "Gói khám tổng quát"
 *               description:
 *                 type: string
 *               bundle_price:
 *                 type: number
 *                 example: 1500000
 *               valid_from:
 *                 type: string
 *                 format: date
 *                 example: "2026-03-01"
 *               valid_to:
 *                 type: string
 *                 format: date
 *               target_patient_types:
 *                 type: array
 *                 items: { type: string }
 *               max_purchases:
 *                 type: integer
 *               facility_id:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [facility_service_id, item_price]
 *                   properties:
 *                     facility_service_id:
 *                       type: string
 *                       example: "FS_001"
 *                     quantity:
 *                       type: integer
 *                       example: 1
 *                     item_price:
 *                       type: number
 *                       example: 300000
 *     responses:
 *       201:
 *         description: Tạo thành công (kèm items + tính original_total_price)
 *       400:
 *         description: |
 *           - PPL_020: Phải có ít nhất 1 DV
 *           - PPL_022: Không tìm thấy DV cơ sở
 */
router.post('/pricing-policies/bundles', verifyAccessToken, authorizeRoles('ADMIN'), BillingPricingPolicyController.createBundle);

/**
 * @swagger
 * /api/billing/pricing-policies/bundles:
 *   get:
 *     summary: Danh sách gói dịch vụ
 *     description: |
 *       Phân quyền: BILLING_DISCOUNT_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.8.3 Gói dịch vụ]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema: { type: string, enum: [true, false] }
 *       - in: query
 *         name: facility_id
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *     responses:
 *       200:
 *         description: Danh sách + phân trang
 */
router.get('/pricing-policies/bundles', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingPricingPolicyController.getBundles);

/**
 * @swagger
 * /api/billing/pricing-policies/bundles/{id}:
 *   get:
 *     summary: Chi tiết gói dịch vụ (kèm items)
 *     description: |
 *       Phân quyền: BILLING_DISCOUNT_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.8.3 Gói dịch vụ]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "BDL_abc123" }
 *     responses:
 *       200:
 *         description: Chi tiết + items
 *       404:
 *         description: Không tìm thấy
 */
router.get('/pricing-policies/bundles/:id', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingPricingPolicyController.getBundleById);

/**
 * @swagger
 * /api/billing/pricing-policies/bundles/{id}:
 *   put:
 *     summary: Cập nhật gói dịch vụ
 *     description: |
 *       Auto-recalc discount_percentage khi bundle_price thay đổi.
 *
 *       Phân quyền: BILLING_BUNDLE_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.8.3 Gói dịch vụ]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               bundle_price: { type: number }
 *               valid_to: { type: string, format: date }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/pricing-policies/bundles/:id', verifyAccessToken, authorizeRoles('ADMIN'), BillingPricingPolicyController.updateBundle);

/**
 * @swagger
 * /api/billing/pricing-policies/bundles/{id}:
 *   delete:
 *     summary: Vô hiệu hóa gói dịch vụ
 *     description: |
 *       Phân quyền: BILLING_BUNDLE_MANAGE
 *       Vai trò được phép: ADMIN
 *     tags: [9.8.3 Gói dịch vụ]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Vô hiệu hóa thành công
 */
router.delete('/pricing-policies/bundles/:id', verifyAccessToken, authorizeRoles('ADMIN'), BillingPricingPolicyController.deleteBundle);

/**
 * @swagger
 * /api/billing/pricing-policies/bundles/{id}/calculate:
 *   post:
 *     summary: Tính giá gói vs giá lẻ
 *     description: |
 *       So sánh bundle_price vs original_total_price: số tiền tiết kiệm, %, từng item.
 *
 *       Phân quyền: BILLING_DISCOUNT_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.8.3 Gói dịch vụ]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: "BDL_abc123" }
 *     responses:
 *       200:
 *         description: |
 *           bundle_price, original_total_price, saving_amount, saving_percentage, items[]
 *       404:
 *         description: Không tìm thấy
 */
router.post('/pricing-policies/bundles/:id/calculate', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingPricingPolicyController.calculateBundle);

// ═══════════════════════════════════════════════════════════════
// NHÓM 4: TỔNG QUAN
// ═══════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/billing/pricing-policies/active-promotions:
 *   get:
 *     summary: Danh sách ưu đãi đang chạy
 *     description: |
 *       Trả về tất cả discounts + vouchers + bundles active & trong thời hạn.
 *
 *       Phân quyền: BILLING_DISCOUNT_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.8.4 Tổng quan & Lịch sử]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: facility_id
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: |
 *           discounts[], vouchers[], bundles[], total_active
 */
router.get('/pricing-policies/active-promotions', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingPricingPolicyController.getActivePromotions);

/**
 * @swagger
 * /api/billing/pricing-policies/history:
 *   get:
 *     summary: Lịch sử thay đổi chính sách giá
 *     description: |
 *       Đọc từ service_price_history (Module 9.1).
 *       Filter theo facility_service_id, change_source.
 *
 *       Phân quyền: BILLING_DISCOUNT_VIEW
 *       Vai trò được phép: ADMIN, STAFF
 *     tags: [9.8.4 Tổng quan & Lịch sử]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: facility_service_id
 *         schema: { type: string }
 *       - in: query
 *         name: change_source
 *         schema: { type: string, enum: [PRICE_POLICY, SPECIALTY_PRICE, FACILITY_SERVICE] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *     responses:
 *       200:
 *         description: Lịch sử + phân trang
 */
router.get('/pricing-policies/history', verifyAccessToken, authorizeRoles('ADMIN', 'STAFF'), BillingPricingPolicyController.getPolicyHistory);

export default router;
