import { Router } from 'express';
import { BillingPricingController } from '../../controllers/Billing/billing-pricing.controller';
import { verifyAccessToken } from '../../middleware/verifyAccessToken.middleware';
import { checkSessionStatus } from '../../middleware/checkSessionStatus.middleware';
import { authorizePermissions } from '../../middleware/authorizePermissions.middleware';

const router = Router();

// Middleware chung
router.use(verifyAccessToken);
router.use(checkSessionStatus);

// =============================================================================
//  NHÓM 1: DANH MỤC DỊCH VỤ (SERVICE CATALOG)
// =============================================================================

/**
 * @swagger
 * tags:
 *   name: 9.1.1 Danh mục dịch vụ & bảng giá
 *   description: |
 *     Danh mục tổng hợp dịch vụ y tế, bao gồm dịch vụ khám bệnh (KHAM),
 *     cận lâm sàng (XN, CDHA, THUTHUAT) và bảng giá tại từng cơ sở.
 */

/**
 * @swagger
 * /api/billing/pricing/catalog:
 *   get:
 *     summary: Xem danh mục dịch vụ tổng hợp
 *     description: |
 *       Lấy danh sách dịch vụ chuẩn quốc gia từ bảng `services`, kèm thống kê
 *       số cơ sở đang triển khai mỗi dịch vụ. Dùng cho trang quản lý danh mục dịch vụ.
 *
 *       **Phân quyền:** Yêu cầu quyền `BILLING_PRICING_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE, PHARMACIST
 *     tags: [9.1.1 Danh mục dịch vụ & bảng giá]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: serviceGroup
 *         schema:
 *           type: string
 *           example: "KHAM"
 *         description: "Nhóm dịch vụ: KHAM, XN, CDHA, THUTHUAT"
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *           example: "CLINICAL"
 *         description: "Phân loại: CLINICAL, LABORATORY, RADIOLOGY, PROCEDURE"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: "xét nghiệm máu"
 *         description: "Tìm theo mã hoặc tên dịch vụ"
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           example: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           example: 20
 *     responses:
 *       200:
 *         description: Danh sách dịch vụ kèm thống kê
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/catalog', authorizePermissions('BILLING_PRICING_VIEW'), BillingPricingController.getServiceCatalog);

/**
 * @swagger
 * /api/billing/pricing/catalog/{facilityId}:
 *   get:
 *     summary: Bảng giá tổng hợp tại 1 cơ sở
 *     description: |
 *       Lấy danh sách dịch vụ tại 1 cơ sở kèm **tất cả mức giá** đang hiệu lực
 *       (giá cơ bản, giá BHYT, giá VIP + các chính sách giá theo đối tượng).
 *
 *       **Phân quyền:** Yêu cầu quyền `BILLING_PRICING_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE, PHARMACIST
 *     tags: [9.1.1 Danh mục dịch vụ & bảng giá]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FAC_01"
 *       - in: query
 *         name: serviceGroup
 *         schema:
 *           type: string
 *           example: "KHAM"
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: "Lọc theo khoa/phòng"
 *       - in: query
 *         name: patientType
 *         schema:
 *           type: string
 *           example: "STANDARD"
 *         description: "Lọc chính sách giá theo đối tượng: STANDARD, INSURANCE, VIP, EMPLOYEE, CHILD, ELDERLY"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: "khám tổng quát"
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
 *         description: Bảng giá dịch vụ kèm chính sách giá đang hiệu lực
 *       404:
 *         description: Không tìm thấy cơ sở (BPR_011)
 */
router.get('/catalog/:facilityId', authorizePermissions('BILLING_PRICING_VIEW'), BillingPricingController.getFacilityPriceCatalog);

// =============================================================================
//  NHÓM 2: CHÍNH SÁCH GIÁ THEO ĐỐI TƯỢNG (PRICE POLICIES)
// =============================================================================

/**
 * @swagger
 * tags:
 *   name: 9.1.2 Chính sách giá theo đối tượng
 *   description: |
 *     Quản lý chính sách giá linh hoạt cho từng dịch vụ cơ sở.
 *     Mỗi dịch vụ có thể có nhiều mức giá khác nhau theo đối tượng bệnh nhân
 *     (thường, BHYT, VIP, nhân viên, trẻ em, người cao tuổi).
 */

/**
 * @swagger
 * /api/billing/pricing/policies/{facilityServiceId}:
 *   get:
 *     summary: Xem chính sách giá của 1 dịch vụ cơ sở
 *     description: |
 *       Lấy tất cả chính sách giá đã cấu hình cho 1 dịch vụ cơ sở,
 *       bao gồm cả chính sách đang hiệu lực và đã hết hạn.
 *
 *       **Phân quyền:** Yêu cầu quyền `BILLING_PRICING_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE, PHARMACIST
 *     tags: [9.1.2 Chính sách giá theo đối tượng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityServiceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FSRV_abc123def456"
 *       - in: query
 *         name: patientType
 *         schema:
 *           type: string
 *           example: "VIP"
 *         description: "Lọc theo đối tượng"
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           example: true
 *       - in: query
 *         name: effectiveDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-03-18"
 *         description: "Chỉ lấy chính sách đang hiệu lực tại ngày này"
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
 *         description: Danh sách chính sách giá
 *       404:
 *         description: Không tìm thấy dịch vụ cơ sở (BPR_005)
 */
router.get('/policies/:facilityServiceId', authorizePermissions('BILLING_PRICING_VIEW'), BillingPricingController.getPolicies);

/**
 * @swagger
 * /api/billing/pricing/policies:
 *   post:
 *     summary: Tạo mới chính sách giá
 *     description: |
 *       Tạo 1 chính sách giá mới cho 1 dịch vụ cơ sở. Tự động ghi lịch sử thay đổi.
 *
 *       **Phân quyền:** Yêu cầu quyền `BILLING_PRICING_CREATE`
 *
 *       **Vai trò được phép:** ADMIN, STAFF
 *     tags: [9.1.2 Chính sách giá theo đối tượng]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facility_service_id
 *               - patient_type
 *               - price
 *               - effective_from
 *             properties:
 *               facility_service_id:
 *                 type: string
 *                 example: "FSRV_abc123def456"
 *                 description: "ID dịch vụ cơ sở (từ bảng facility_services)"
 *               patient_type:
 *                 type: string
 *                 example: "VIP"
 *                 description: "Đối tượng: STANDARD, INSURANCE, VIP, EMPLOYEE, CHILD, ELDERLY"
 *               price:
 *                 type: number
 *                 example: 500000
 *                 description: "Giá áp dụng (VNĐ, >= 0)"
 *               currency:
 *                 type: string
 *                 example: "VND"
 *                 default: "VND"
 *               description:
 *                 type: string
 *                 example: "Giá VIP cho bệnh nhân ưu tiên"
 *               effective_from:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-01"
 *                 description: "Ngày bắt đầu hiệu lực"
 *               effective_to:
 *                 type: string
 *                 format: date
 *                 example: "2026-12-31"
 *                 description: "Ngày hết hiệu lực (bỏ trống = vĩnh viễn)"
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: |
 *           Lỗi validation:
 *           - BPR_002: Trùng chính sách
 *           - BPR_003: Loại đối tượng không hợp lệ
 *           - BPR_004: Giá không hợp lệ
 *           - BPR_010: Ngày hiệu lực không hợp lệ
 *       404:
 *         description: Không tìm thấy dịch vụ cơ sở (BPR_005)
 */
router.post('/policies', authorizePermissions('BILLING_PRICING_CREATE'), BillingPricingController.createPolicy);

/**
 * @swagger
 * /api/billing/pricing/policies/bulk:
 *   post:
 *     summary: Tạo hàng loạt chính sách giá
 *     description: |
 *       Tạo nhiều chính sách giá cho 1 dịch vụ cơ sở trong 1 lần gọi.
 *       Xử lý trong transaction — nếu 1 policy lỗi sẽ rollback toàn bộ.
 *
 *       **Phân quyền:** Yêu cầu quyền `BILLING_PRICING_CREATE`
 *
 *       **Vai trò được phép:** ADMIN, STAFF
 *     tags: [9.1.2 Chính sách giá theo đối tượng]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facility_service_id
 *               - policies
 *             properties:
 *               facility_service_id:
 *                 type: string
 *                 example: "FSRV_abc123def456"
 *               policies:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - patient_type
 *                     - price
 *                     - effective_from
 *                   properties:
 *                     patient_type:
 *                       type: string
 *                       example: "STANDARD"
 *                     price:
 *                       type: number
 *                       example: 300000
 *                     description:
 *                       type: string
 *                       example: "Giá thường"
 *                     effective_from:
 *                       type: string
 *                       format: date
 *                       example: "2026-04-01"
 *                     effective_to:
 *                       type: string
 *                       format: date
 *                       example: "2026-12-31"
 *                 example:
 *                   - patient_type: "STANDARD"
 *                     price: 300000
 *                     effective_from: "2026-04-01"
 *                     description: "Giá thường"
 *                   - patient_type: "INSURANCE"
 *                     price: 120000
 *                     effective_from: "2026-04-01"
 *                     description: "Giá BHYT"
 *                   - patient_type: "VIP"
 *                     price: 500000
 *                     effective_from: "2026-04-01"
 *                     description: "Giá VIP"
 *     responses:
 *       201:
 *         description: Tạo hàng loạt thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc danh sách rỗng (BPR_012)
 *       404:
 *         description: Không tìm thấy dịch vụ cơ sở (BPR_005)
 */
router.post('/policies/bulk', authorizePermissions('BILLING_PRICING_CREATE'), BillingPricingController.bulkCreatePolicies);

/**
 * @swagger
 * /api/billing/pricing/policies/{policyId}:
 *   put:
 *     summary: Cập nhật chính sách giá
 *     description: |
 *       Sửa thông tin chính sách giá. **Bắt buộc** cung cấp lý do thay đổi (`reason`).
 *       Tự động ghi lịch sử cả giá cũ và giá mới.
 *
 *       **Phân quyền:** Yêu cầu quyền `BILLING_PRICING_UPDATE`
 *
 *       **Vai trò được phép:** ADMIN, STAFF
 *     tags: [9.1.2 Chính sách giá theo đối tượng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SPP_abc123def456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               price:
 *                 type: number
 *                 example: 550000
 *               patient_type:
 *                 type: string
 *                 example: "VIP"
 *               description:
 *                 type: string
 *                 example: "Điều chỉnh giá VIP theo quy định mới"
 *               effective_from:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-01"
 *               effective_to:
 *                 type: string
 *                 format: date
 *                 example: "2026-12-31"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *               reason:
 *                 type: string
 *                 example: "Điều chỉnh giá theo Quyết định số 123/QĐ-BYT"
 *                 description: "Bắt buộc — Lý do thay đổi giá"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Thiếu lý do (BPR_009) hoặc dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy chính sách (BPR_001)
 */
router.put('/policies/:policyId', authorizePermissions('BILLING_PRICING_UPDATE'), BillingPricingController.updatePolicy);

/**
 * @swagger
 * /api/billing/pricing/policies/{policyId}:
 *   delete:
 *     summary: Vô hiệu hóa chính sách giá
 *     description: |
 *       Soft delete — đặt `is_active = false`. Không xóa vật lý để giữ lịch sử.
 *       **Bắt buộc** cung cấp lý do (`reason`).
 *
 *       **Phân quyền:** Yêu cầu quyền `BILLING_PRICING_DELETE`
 *
 *       **Vai trò được phép:** ADMIN, STAFF
 *     tags: [9.1.2 Chính sách giá theo đối tượng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SPP_abc123def456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Chính sách giá này không còn phù hợp với quy định mới"
 *     responses:
 *       200:
 *         description: Vô hiệu hóa thành công
 *       400:
 *         description: Thiếu lý do (BPR_009)
 *       404:
 *         description: Không tìm thấy chính sách (BPR_001)
 */
router.delete('/policies/:policyId', authorizePermissions('BILLING_PRICING_DELETE'), BillingPricingController.deletePolicy);

/**
 * @swagger
 * /api/billing/pricing/resolve:
 *   get:
 *     summary: Tra cứu giá cuối cùng (Price Resolver)
 *     description: |
 *       Tra cứu giá cuối cùng cho 1 dịch vụ + đối tượng + chuyên khoa (tùy chọn).
 *       Logic ưu tiên: **Giá chuyên khoa → Chính sách giá theo đối tượng → Giá cứng facility_services**.
 *
 *       API này được sử dụng bởi các module khác (EMR, Billing, Appointment) để lấy giá
 *       áp dụng thực tế khi tạo hóa đơn hoặc hiển thị giá cho bệnh nhân.
 *
 *       **Phân quyền:** Yêu cầu quyền `BILLING_PRICING_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE, PHARMACIST
 *     tags: [9.1.2 Chính sách giá theo đối tượng]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: facilityServiceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FSRV_abc123def456"
 *       - in: query
 *         name: patientType
 *         required: true
 *         schema:
 *           type: string
 *           example: "INSURANCE"
 *         description: "STANDARD, INSURANCE, VIP, EMPLOYEE, CHILD, ELDERLY"
 *       - in: query
 *         name: specialtyId
 *         schema:
 *           type: string
 *           example: "SPEC_TIM_MACH"
 *         description: "ID chuyên khoa (nếu có, sẽ kiểm tra giá chuyên khoa trước)"
 *       - in: query
 *         name: referenceDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-03-18"
 *         description: "Ngày tham chiếu (mặc định = hôm nay)"
 *     responses:
 *       200:
 *         description: |
 *           Trả về giá đã phân giải kèm nguồn dữ liệu.
 *           Ví dụ: `{ resolved_price: "500000", source: "PRICE_POLICY", policy_id: "SPP_xxx" }`
 *       400:
 *         description: Loại đối tượng không hợp lệ (BPR_003)
 *       404:
 *         description: Không tìm thấy dịch vụ hoặc chuyên khoa (BPR_005, BPR_006)
 */
router.get('/resolve', authorizePermissions('BILLING_PRICING_VIEW'), BillingPricingController.resolvePrice);

// =============================================================================
//  NHÓM 3: GIÁ THEO CHUYÊN KHOA (SPECIALTY PRICING)
// =============================================================================

/**
 * @swagger
 * tags:
 *   name: 9.1.3 Giá theo chuyên khoa
 *   description: |
 *     Override giá cho từng chuyên khoa cụ thể. Cùng 1 dịch vụ,
 *     chuyên khoa Tim mạch có thể đắt hơn chuyên khoa Nhi.
 */

/**
 * @swagger
 * /api/billing/pricing/specialty-prices/{facilityServiceId}:
 *   get:
 *     summary: Xem giá theo chuyên khoa
 *     description: |
 *       Lấy tất cả cấu hình giá chuyên khoa cho 1 dịch vụ cơ sở.
 *
 *       **Phân quyền:** Yêu cầu quyền `BILLING_PRICING_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, STAFF, DOCTOR, NURSE, PHARMACIST
 *     tags: [9.1.3 Giá theo chuyên khoa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityServiceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FSRV_abc123def456"
 *       - in: query
 *         name: specialtyId
 *         schema:
 *           type: string
 *         description: "Lọc theo chuyên khoa"
 *       - in: query
 *         name: patientType
 *         schema:
 *           type: string
 *           example: "STANDARD"
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           example: true
 *     responses:
 *       200:
 *         description: Danh sách giá chuyên khoa
 *       404:
 *         description: Không tìm thấy dịch vụ cơ sở (BPR_005)
 */
router.get('/specialty-prices/:facilityServiceId', authorizePermissions('BILLING_PRICING_VIEW'), BillingPricingController.getSpecialtyPrices);

/**
 * @swagger
 * /api/billing/pricing/specialty-prices:
 *   post:
 *     summary: Tạo giá chuyên khoa
 *     description: |
 *       Cấu hình giá riêng cho 1 dịch vụ tại 1 chuyên khoa cụ thể.
 *       Tự động ghi lịch sử thay đổi.
 *
 *       **Phân quyền:** Yêu cầu quyền `BILLING_PRICING_CREATE`
 *
 *       **Vai trò được phép:** ADMIN, STAFF
 *     tags: [9.1.3 Giá theo chuyên khoa]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facility_service_id
 *               - specialty_id
 *               - price
 *               - effective_from
 *             properties:
 *               facility_service_id:
 *                 type: string
 *                 example: "FSRV_abc123def456"
 *               specialty_id:
 *                 type: string
 *                 example: "SPEC_TIM_MACH"
 *                 description: "ID chuyên khoa"
 *               patient_type:
 *                 type: string
 *                 example: "STANDARD"
 *                 default: "STANDARD"
 *                 description: "Đối tượng: STANDARD, INSURANCE, VIP, EMPLOYEE, CHILD, ELDERLY"
 *               price:
 *                 type: number
 *                 example: 500000
 *               effective_from:
 *                 type: string
 *                 format: date
 *                 example: "2026-04-01"
 *               effective_to:
 *                 type: string
 *                 format: date
 *                 example: "2026-12-31"
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       400:
 *         description: Trùng cấu hình (BPR_008) hoặc dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy dịch vụ/chuyên khoa (BPR_005, BPR_006)
 */
router.post('/specialty-prices', authorizePermissions('BILLING_PRICING_CREATE'), BillingPricingController.createSpecialtyPrice);

/**
 * @swagger
 * /api/billing/pricing/specialty-prices/{specialtyPriceId}:
 *   put:
 *     summary: Cập nhật giá chuyên khoa
 *     description: |
 *       Sửa cấu hình giá chuyên khoa. **Bắt buộc** cung cấp `reason`.
 *
 *       **Phân quyền:** Yêu cầu quyền `BILLING_PRICING_UPDATE`
 *
 *       **Vai trò được phép:** ADMIN, STAFF
 *     tags: [9.1.3 Giá theo chuyên khoa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: specialtyPriceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FSSP_abc123def456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               price:
 *                 type: number
 *                 example: 550000
 *               patient_type:
 *                 type: string
 *                 example: "VIP"
 *               effective_from:
 *                 type: string
 *                 format: date
 *               effective_to:
 *                 type: string
 *                 format: date
 *               is_active:
 *                 type: boolean
 *               reason:
 *                 type: string
 *                 example: "Điều chỉnh giá chuyên khoa Tim mạch"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Thiếu lý do (BPR_009)
 *       404:
 *         description: Không tìm thấy (BPR_007)
 */
router.put('/specialty-prices/:specialtyPriceId', authorizePermissions('BILLING_PRICING_UPDATE'), BillingPricingController.updateSpecialtyPrice);

/**
 * @swagger
 * /api/billing/pricing/specialty-prices/{specialtyPriceId}:
 *   delete:
 *     summary: Vô hiệu hóa giá chuyên khoa
 *     description: |
 *       Soft delete giá chuyên khoa. **Bắt buộc** cung cấp `reason`.
 *
 *       **Phân quyền:** Yêu cầu quyền `BILLING_PRICING_DELETE`
 *
 *       **Vai trò được phép:** ADMIN, STAFF
 *     tags: [9.1.3 Giá theo chuyên khoa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: specialtyPriceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FSSP_abc123def456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Không còn áp dụng giá riêng cho chuyên khoa này"
 *     responses:
 *       200:
 *         description: Vô hiệu hóa thành công
 *       400:
 *         description: Thiếu lý do (BPR_009)
 *       404:
 *         description: Không tìm thấy (BPR_007)
 */
router.delete('/specialty-prices/:specialtyPriceId', authorizePermissions('BILLING_PRICING_DELETE'), BillingPricingController.deleteSpecialtyPrice);

// =============================================================================
//  NHÓM 4: LỊCH SỬ & THỐNG KÊ (HISTORY & STATISTICS)
// =============================================================================

/**
 * @swagger
 * tags:
 *   name: 9.1.4 Lịch sử & thống kê bảng giá
 *   description: |
 *     Audit trail tất cả thay đổi giá, thống kê tổng hợp,
 *     so sánh giá liên cơ sở, cảnh báo chính sách sắp hết hạn.
 */

/**
 * @swagger
 * /api/billing/pricing/history/{facilityServiceId}:
 *   get:
 *     summary: Lịch sử thay đổi giá 1 dịch vụ cơ sở
 *     description: |
 *       Xem toàn bộ lịch sử CREATE/UPDATE/DELETE giá cho 1 dịch vụ cụ thể.
 *       Hiển thị giá cũ, giá mới, người thay đổi, lý do, thời gian.
 *
 *       **Phân quyền:** Yêu cầu quyền `BILLING_PRICING_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, STAFF
 *     tags: [9.1.4 Lịch sử & thống kê bảng giá]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityServiceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FSRV_abc123def456"
 *       - in: query
 *         name: changeType
 *         schema:
 *           type: string
 *           example: "UPDATE"
 *         description: "CREATE, UPDATE, DELETE"
 *       - in: query
 *         name: changeSource
 *         schema:
 *           type: string
 *           example: "PRICE_POLICY"
 *         description: "PRICE_POLICY, SPECIALTY_PRICE, FACILITY_SERVICE"
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-01-01"
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-12-31"
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
 *         description: Lịch sử thay đổi giá
 *       404:
 *         description: Không tìm thấy dịch vụ cơ sở (BPR_005)
 */
router.get('/history/:facilityServiceId', authorizePermissions('BILLING_PRICING_VIEW'), BillingPricingController.getHistoryByService);

/**
 * @swagger
 * /api/billing/pricing/history/facility/{facilityId}:
 *   get:
 *     summary: Lịch sử thay đổi giá toàn cơ sở
 *     description: |
 *       Xem toàn bộ lịch sử thay đổi giá của tất cả dịch vụ trong 1 cơ sở.
 *       Kèm tên dịch vụ, tên chuyên khoa, tên người thay đổi.
 *
 *       **Phân quyền:** Yêu cầu quyền `BILLING_PRICING_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, STAFF
 *     tags: [9.1.4 Lịch sử & thống kê bảng giá]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FAC_01"
 *       - in: query
 *         name: changeType
 *         schema:
 *           type: string
 *       - in: query
 *         name: changeSource
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
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
 *         description: Lịch sử thay đổi giá toàn cơ sở
 *       404:
 *         description: Không tìm thấy cơ sở (BPR_011)
 */
router.get('/history/facility/:facilityId', authorizePermissions('BILLING_PRICING_VIEW'), BillingPricingController.getHistoryByFacility);

/**
 * @swagger
 * /api/billing/pricing/compare:
 *   get:
 *     summary: So sánh giá liên cơ sở
 *     description: |
 *       So sánh giá của cùng 1 dịch vụ chuẩn giữa tất cả các cơ sở đang triển khai.
 *       Kết quả xếp theo giá từ thấp đến cao.
 *
 *       **Phân quyền:** Yêu cầu quyền `BILLING_PRICING_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, STAFF
 *     tags: [9.1.4 Lịch sử & thống kê bảng giá]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *           example: "SRV_KHAM_TONG_QUAT"
 *         description: "ID dịch vụ chuẩn (services_id)"
 *       - in: query
 *         name: patientType
 *         schema:
 *           type: string
 *           example: "STANDARD"
 *           default: "STANDARD"
 *     responses:
 *       200:
 *         description: Bảng so sánh giá giữa các cơ sở
 *       404:
 *         description: Không tìm thấy dịch vụ (BPR_013)
 */
router.get('/compare', authorizePermissions('BILLING_PRICING_VIEW'), BillingPricingController.comparePrices);

/**
 * @swagger
 * /api/billing/pricing/summary/{facilityId}:
 *   get:
 *     summary: Thống kê tổng hợp bảng giá cơ sở
 *     description: |
 *       Lấy thống kê tổng quan: tổng số DV, giá min/max/avg,
 *       số DV có BHYT, số DV chưa cấu hình chính sách,
 *       số chính sách sắp hết hạn (30 ngày tới).
 *
 *       **Phân quyền:** Yêu cầu quyền `BILLING_PRICING_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, STAFF
 *     tags: [9.1.4 Lịch sử & thống kê bảng giá]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FAC_01"
 *     responses:
 *       200:
 *         description: Thống kê tổng hợp
 *       404:
 *         description: Không tìm thấy cơ sở (BPR_011)
 */
router.get('/summary/:facilityId', authorizePermissions('BILLING_PRICING_VIEW'), BillingPricingController.getSummary);

/**
 * @swagger
 * /api/billing/pricing/expiring-policies/{facilityId}:
 *   get:
 *     summary: Chính sách giá sắp hết hiệu lực
 *     description: |
 *       Lấy danh sách các chính sách giá sẽ hết hiệu lực trong N ngày tới
 *       (mặc định 30 ngày). Dùng để cảnh báo quản trị viên gia hạn hoặc
 *       tạo chính sách mới.
 *
 *       **Phân quyền:** Yêu cầu quyền `BILLING_PRICING_VIEW`
 *
 *       **Vai trò được phép:** ADMIN, STAFF
 *     tags: [9.1.4 Lịch sử & thống kê bảng giá]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema:
 *           type: string
 *           example: "FAC_01"
 *       - in: query
 *         name: warningDays
 *         schema:
 *           type: integer
 *           default: 30
 *           example: 30
 *         description: "Số ngày trước khi hết hạn (mặc định 30)"
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
 *         description: Danh sách chính sách sắp hết hiệu lực
 *       404:
 *         description: Không tìm thấy cơ sở (BPR_011)
 */
router.get('/expiring-policies/:facilityId', authorizePermissions('BILLING_PRICING_VIEW'), BillingPricingController.getExpiringPolicies);

export default router;
