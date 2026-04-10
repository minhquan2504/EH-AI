import { Request, Response, NextFunction } from 'express';
import { BillingReconciliationService } from '../../services/Billing/billing-reconciliation.service';
import { RECONCILE_CONFIG, RECONCILE_SUCCESS } from '../../constants/billing-reconciliation.constant';

export class BillingReconciliationController {

    // ═══ NHÓM 1: ĐỐI SOÁT ═══

    /** Chạy đối soát online */
    static async runOnlineReconciliation(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.runOnlineReconciliation(req.body, userId);
            res.status(201).json({ success: true, message: RECONCILE_SUCCESS.ONLINE_RECONCILED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Chạy đối soát ca */
    static async runShiftReconciliation(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.runShiftReconciliation(
                String(req.params.shiftId), req.body, userId
            );
            res.status(201).json({ success: true, message: RECONCILE_SUCCESS.SHIFT_RECONCILED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Danh sách phiên đối soát */
    static async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { type, status, facility_id, date_from, date_to } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : RECONCILE_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : RECONCILE_CONFIG.DEFAULT_LIMIT;
            const data = await BillingReconciliationService.getSessions(
                type as string, status as string, facility_id as string,
                date_from as string, date_to as string, page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) { next(error); }
    }

    /** Chi tiết phiên */
    static async getSessionById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingReconciliationService.getSessionById(String(req.params.id));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Chênh lệch ca */
    static async getShiftDiscrepancy(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingReconciliationService.getShiftDiscrepancy(String(req.params.shiftId));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    // ═══ NHÓM 2: XỬ LÝ CHÊNH LỆCH ═══

    /** Báo cáo chênh lệch */
    static async getDiscrepancyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingReconciliationService.getDiscrepancyReport(req.query.facility_id as string);
            res.json({ success: true, data });
        } catch (error: any) { next(error); }
    }

    /** Xử lý chênh lệch */
    static async resolveItem(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.resolveItem(
                String(req.params.itemId), req.body, userId
            );
            res.json({ success: true, message: RECONCILE_SUCCESS.ITEM_RESOLVED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Review phiên */
    static async reviewSession(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.reviewSession(
                String(req.params.id), req.body.notes, userId
            );
            res.json({ success: true, message: RECONCILE_SUCCESS.SESSION_REVIEWED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Phê duyệt phiên */
    static async approveSession(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.approveSession(String(req.params.id), userId);
            res.json({ success: true, message: RECONCILE_SUCCESS.SESSION_APPROVED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Từ chối phiên */
    static async rejectSession(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.rejectSession(
                String(req.params.id), req.body.reject_reason, userId
            );
            res.json({ success: true, message: RECONCILE_SUCCESS.SESSION_REJECTED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    // ═══ NHÓM 3: QUYẾT TOÁN ═══

    /** Tạo phiếu quyết toán */
    static async createSettlement(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.createSettlement(req.body, userId);
            res.status(201).json({ success: true, message: RECONCILE_SUCCESS.SETTLEMENT_CREATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Gửi phiếu */
    static async submitSettlement(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.submitSettlement(String(req.params.id), userId);
            res.json({ success: true, message: RECONCILE_SUCCESS.SETTLEMENT_SUBMITTED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Phê duyệt quyết toán */
    static async approveSettlement(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.approveSettlement(String(req.params.id), userId);
            res.json({ success: true, message: RECONCILE_SUCCESS.SETTLEMENT_APPROVED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Từ chối quyết toán */
    static async rejectSettlement(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingReconciliationService.rejectSettlement(String(req.params.id), req.body, userId);
            res.json({ success: true, message: RECONCILE_SUCCESS.SETTLEMENT_REJECTED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Danh sách phiếu */
    static async getSettlements(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { type, status, facility_id, date_from, date_to } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : RECONCILE_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : RECONCILE_CONFIG.DEFAULT_LIMIT;
            const data = await BillingReconciliationService.getSettlements(
                type as string, status as string, facility_id as string,
                date_from as string, date_to as string, page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) { next(error); }
    }

    /** Chi tiết phiếu */
    static async getSettlementById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingReconciliationService.getSettlementById(String(req.params.id));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    // ═══ NHÓM 4: LỊCH SỬ & XUẤT ═══

    /** Lịch sử đối soát */
    static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { type, status, facility_id, date_from, date_to } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : RECONCILE_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : RECONCILE_CONFIG.DEFAULT_LIMIT;
            const data = await BillingReconciliationService.getReconciliationHistory(
                type as string, status as string, facility_id as string,
                date_from as string, date_to as string, page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) { next(error); }
    }

    /** Xuất data quyết toán */
    static async exportSettlement(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingReconciliationService.exportSettlementData(String(req.params.id));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }
}
