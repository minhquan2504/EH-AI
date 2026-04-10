import { Request, Response, NextFunction } from 'express';
import { BillingPricingPolicyService } from '../../services/Billing/billing-pricing-policy.service';
import { POLICY_CONFIG, POLICY_SUCCESS } from '../../constants/billing-pricing-policy.constant';

export class BillingPricingPolicyController {

    // ═══ NHÓM 1: CHÍNH SÁCH GIẢM GIÁ ═══

    /** Tạo */
    static async createDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingPricingPolicyService.createDiscount(req.body, userId);
            res.status(201).json({ success: true, message: POLICY_SUCCESS.DISCOUNT_CREATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Danh sách */
    static async getDiscounts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { discount_type, apply_to, is_active, facility_id } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : POLICY_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : POLICY_CONFIG.DEFAULT_LIMIT;
            const data = await BillingPricingPolicyService.getDiscounts(
                discount_type as string, apply_to as string, is_active as string,
                facility_id as string, page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) { next(error); }
    }

    /** Chi tiết */
    static async getDiscountById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingPricingPolicyService.getDiscountById(String(req.params.id));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Cập nhật */
    static async updateDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingPricingPolicyService.updateDiscount(String(req.params.id), req.body);
            res.json({ success: true, message: POLICY_SUCCESS.DISCOUNT_UPDATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Vô hiệu hóa */
    static async deleteDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await BillingPricingPolicyService.deleteDiscount(String(req.params.id));
            res.json({ success: true, message: POLICY_SUCCESS.DISCOUNT_DELETED });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Tính giảm giá */
    static async calculateDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { services, patient_type, facility_id } = req.body;
            const data = await BillingPricingPolicyService.calculateDiscount(services, patient_type, facility_id);
            res.json({ success: true, data });
        } catch (error: any) { next(error); }
    }

    // ═══ NHÓM 2: VOUCHER ═══

    /** Tạo */
    static async createVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingPricingPolicyService.createVoucher(req.body, userId);
            res.status(201).json({ success: true, message: POLICY_SUCCESS.VOUCHER_CREATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Danh sách */
    static async getVouchers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { is_active, facility_id } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : POLICY_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : POLICY_CONFIG.DEFAULT_LIMIT;
            const data = await BillingPricingPolicyService.getVouchers(
                is_active as string, facility_id as string, page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) { next(error); }
    }

    /** Chi tiết */
    static async getVoucherById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingPricingPolicyService.getVoucherById(String(req.params.id));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Cập nhật */
    static async updateVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingPricingPolicyService.updateVoucher(String(req.params.id), req.body);
            res.json({ success: true, message: POLICY_SUCCESS.VOUCHER_UPDATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Vô hiệu hóa */
    static async deleteVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await BillingPricingPolicyService.deleteVoucher(String(req.params.id));
            res.json({ success: true, message: POLICY_SUCCESS.VOUCHER_DELETED });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Validate voucher code */
    static async validateVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingPricingPolicyService.validateVoucher(req.body);
            res.json({ success: true, message: POLICY_SUCCESS.VOUCHER_VALID, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Redeem voucher */
    static async redeemVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingPricingPolicyService.redeemVoucher(req.body, userId);
            res.json({ success: true, message: POLICY_SUCCESS.VOUCHER_REDEEMED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Lịch sử sử dụng */
    static async getVoucherUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingPricingPolicyService.getVoucherUsage(String(req.params.id));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    // ═══ NHÓM 3: GÓI DỊCH VỤ ═══

    /** Tạo */
    static async createBundle(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingPricingPolicyService.createBundle(req.body, userId);
            res.status(201).json({ success: true, message: POLICY_SUCCESS.BUNDLE_CREATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Danh sách */
    static async getBundles(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { is_active, facility_id } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : POLICY_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : POLICY_CONFIG.DEFAULT_LIMIT;
            const data = await BillingPricingPolicyService.getBundles(
                is_active as string, facility_id as string, page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) { next(error); }
    }

    /** Chi tiết + items */
    static async getBundleById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingPricingPolicyService.getBundleById(String(req.params.id));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Cập nhật */
    static async updateBundle(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingPricingPolicyService.updateBundle(String(req.params.id), req.body);
            res.json({ success: true, message: POLICY_SUCCESS.BUNDLE_UPDATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Vô hiệu hóa */
    static async deleteBundle(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await BillingPricingPolicyService.deleteBundle(String(req.params.id));
            res.json({ success: true, message: POLICY_SUCCESS.BUNDLE_DELETED });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Tính giá gói vs giá lẻ */
    static async calculateBundle(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingPricingPolicyService.calculateBundle(String(req.params.id));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    // ═══ NHÓM 4: TỔNG QUAN ═══

    /** Ưu đãi đang chạy */
    static async getActivePromotions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingPricingPolicyService.getActivePromotions(req.query.facility_id as string);
            res.json({ success: true, data });
        } catch (error: any) { next(error); }
    }

    /** Lịch sử thay đổi */
    static async getPolicyHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { facility_service_id, change_source } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : POLICY_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : POLICY_CONFIG.DEFAULT_LIMIT;
            const data = await BillingPricingPolicyService.getPolicyHistory(
                facility_service_id as string, change_source as string, page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) { next(error); }
    }
}
