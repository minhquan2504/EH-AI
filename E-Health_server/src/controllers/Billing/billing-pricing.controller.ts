import { Request, Response, NextFunction } from 'express';
import { BillingPricingService } from '../../services/Billing/billing-pricing.service';
import {
    CreatePricePolicyInput,
    UpdatePricePolicyInput,
    CreateSpecialtyPriceInput,
    UpdateSpecialtyPriceInput,
    BulkCreatePoliciesInput,
} from '../../models/Billing/billing-pricing.model';

export class BillingPricingController {

    // CATALOG (Danh mục dịch vụ)

    /** Danh mục dịch vụ chuẩn */
    static async getServiceCatalog(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const serviceGroup = req.query.serviceGroup as string | undefined;
            const serviceType = req.query.serviceType as string | undefined;
            const search = req.query.search as string | undefined;
            let isActive: boolean | undefined;
            if (req.query.isActive !== undefined) isActive = req.query.isActive === 'true';
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await BillingPricingService.getServiceCatalog(serviceGroup, serviceType, search, isActive, page, limit);
            res.status(200).json({ success: true, ...result });
        } catch (error) { next(error); }
    }

    /** Bảng giá tổng hợp cơ sở */
    static async getFacilityPriceCatalog(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const facilityId = String(req.params.facilityId);
            const serviceGroup = req.query.serviceGroup as string | undefined;
            const departmentId = req.query.departmentId as string | undefined;
            const patientType = req.query.patientType as string | undefined;
            const search = req.query.search as string | undefined;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await BillingPricingService.getFacilityPriceCatalog(facilityId, serviceGroup, departmentId, patientType, search, page, limit);
            res.status(200).json({ success: true, ...result });
        } catch (error) { next(error); }
    }

    // PRICE POLICIES (Chính sách giá)

    /** Danh sách chính sách giá */
    static async getPolicies(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const facilityServiceId = String(req.params.facilityServiceId);
            const patientType = req.query.patientType as string | undefined;
            let isActive: boolean | undefined;
            if (req.query.isActive !== undefined) isActive = req.query.isActive === 'true';
            const effectiveDate = req.query.effectiveDate as string | undefined;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await BillingPricingService.getPolicies(facilityServiceId, patientType, isActive, effectiveDate, page, limit);
            res.status(200).json({ success: true, ...result });
        } catch (error) { next(error); }
    }

    /** Tạo chính sách giá */
    static async createPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const input: CreatePricePolicyInput = req.body;
            const data = await BillingPricingService.createPolicy(input, userId);
            res.status(201).json({ success: true, data });
        } catch (error) { next(error); }
    }

    /** Cập nhật chính sách giá */
    static async updatePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const policyId = String(req.params.policyId);
            const input: UpdatePricePolicyInput = req.body;
            const data = await BillingPricingService.updatePolicy(policyId, input, userId);
            res.status(200).json({ success: true, data });
        } catch (error) { next(error); }
    }

    /** Xóa chính sách giá (soft) */
    static async deletePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const policyId = String(req.params.policyId);
            const reason = req.body.reason as string;
            const data = await BillingPricingService.deletePolicy(policyId, reason, userId);
            res.status(200).json({ success: true, message: 'Đã vô hiệu hóa chính sách giá thành công.', data });
        } catch (error) { next(error); }
    }

    /** Tạo hàng loạt chính sách giá */
    static async bulkCreatePolicies(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const input: BulkCreatePoliciesInput = req.body;
            const result = await BillingPricingService.bulkCreatePolicies(input, userId);
            res.status(201).json({ success: true, message: `Đã tạo thành công ${result.created} chính sách giá.`, ...result });
        } catch (error) { next(error); }
    }

    /** Tra cứu giá cuối cùng (Price Resolver) */
    static async resolvePrice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const facilityServiceId = req.query.facilityServiceId as string;
            const patientType = req.query.patientType as string;
            const specialtyId = req.query.specialtyId as string | undefined;
            const referenceDate = req.query.referenceDate as string | undefined;

            const data = await BillingPricingService.resolvePrice(facilityServiceId, patientType, specialtyId, referenceDate);
            res.status(200).json({ success: true, data });
        } catch (error) { next(error); }
    }

    // SPECIALTY PRICES (Giá theo chuyên khoa)

    /** Danh sách giá chuyên khoa */
    static async getSpecialtyPrices(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const facilityServiceId = String(req.params.facilityServiceId);
            const specialtyId = req.query.specialtyId as string | undefined;
            const patientType = req.query.patientType as string | undefined;
            let isActive: boolean | undefined;
            if (req.query.isActive !== undefined) isActive = req.query.isActive === 'true';

            const data = await BillingPricingService.getSpecialtyPrices(facilityServiceId, specialtyId, patientType, isActive);
            res.status(200).json({ success: true, data });
        } catch (error) { next(error); }
    }

    /** Tạo giá chuyên khoa */
    static async createSpecialtyPrice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const input: CreateSpecialtyPriceInput = req.body;
            const data = await BillingPricingService.createSpecialtyPrice(input, userId);
            res.status(201).json({ success: true, data });
        } catch (error) { next(error); }
    }

    /** Cập nhật giá chuyên khoa */
    static async updateSpecialtyPrice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const specialtyPriceId = String(req.params.specialtyPriceId);
            const input: UpdateSpecialtyPriceInput = req.body;
            const data = await BillingPricingService.updateSpecialtyPrice(specialtyPriceId, input, userId);
            res.status(200).json({ success: true, data });
        } catch (error) { next(error); }
    }

    /** Xóa giá chuyên khoa (soft) */
    static async deleteSpecialtyPrice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const specialtyPriceId = String(req.params.specialtyPriceId);
            const reason = req.body.reason as string;
            const data = await BillingPricingService.deleteSpecialtyPrice(specialtyPriceId, reason, userId);
            res.status(200).json({ success: true, message: 'Đã vô hiệu hóa giá chuyên khoa thành công.', data });
        } catch (error) { next(error); }
    }

    // HISTORY & STATISTICS

    /** Lịch sử giá 1 dịch vụ cơ sở */
    static async getHistoryByService(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const facilityServiceId = String(req.params.facilityServiceId);
            const changeType = req.query.changeType as string | undefined;
            const changeSource = req.query.changeSource as string | undefined;
            const dateFrom = req.query.dateFrom as string | undefined;
            const dateTo = req.query.dateTo as string | undefined;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await BillingPricingService.getHistoryByFacilityService(
                facilityServiceId, changeType, changeSource, dateFrom, dateTo, page, limit
            );
            res.status(200).json({ success: true, ...result });
        } catch (error) { next(error); }
    }

    /** Lịch sử giá toàn cơ sở */
    static async getHistoryByFacility(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const facilityId = String(req.params.facilityId);
            const changeType = req.query.changeType as string | undefined;
            const changeSource = req.query.changeSource as string | undefined;
            const dateFrom = req.query.dateFrom as string | undefined;
            const dateTo = req.query.dateTo as string | undefined;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await BillingPricingService.getHistoryByFacility(
                facilityId, changeType, changeSource, dateFrom, dateTo, page, limit
            );
            res.status(200).json({ success: true, ...result });
        } catch (error) { next(error); }
    }

    /** So sánh giá liên cơ sở */
    static async comparePrices(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const serviceId = req.query.serviceId as string;
            const patientType = (req.query.patientType as string) || 'STANDARD';
            const data = await BillingPricingService.comparePrices(serviceId, patientType);
            res.status(200).json({ success: true, data });
        } catch (error) { next(error); }
    }

    /** Thống kê bảng giá cơ sở */
    static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const facilityId = String(req.params.facilityId);
            const data = await BillingPricingService.getPricingSummary(facilityId);
            res.status(200).json({ success: true, data });
        } catch (error) { next(error); }
    }

    /** Chính sách sắp hết hạn */
    static async getExpiringPolicies(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const facilityId = String(req.params.facilityId);
            const warningDays = parseInt(req.query.warningDays as string, 10) || 30;
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;

            const result = await BillingPricingService.getExpiringPolicies(facilityId, warningDays, page, limit);
            res.status(200).json({ success: true, ...result });
        } catch (error) { next(error); }
    }
}
