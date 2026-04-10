import { Request, Response, NextFunction } from 'express';
import { BillingRefundService } from '../../services/Billing/billing-refund.service';
import { REFUND_CONFIG, REFUND_SUCCESS } from '../../constants/billing-refund.constant';

export class BillingRefundController {

    // ═══ NHÓM 1: YÊU CẦU HOÀN TIỀN ═══

    /** Tạo yêu cầu hoàn tiền */
    static async createRefundRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingRefundService.createRefundRequest(req.body, userId);
            const isAutoApproved = data.status === 'APPROVED';
            res.status(201).json({
                success: true,
                message: isAutoApproved ? REFUND_SUCCESS.REQUEST_AUTO_APPROVED : REFUND_SUCCESS.REQUEST_CREATED,
                data,
            });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Danh sách */
    static async getRefundRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { status, refund_type, reason_category, patient_id, date_from, date_to } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : REFUND_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : REFUND_CONFIG.DEFAULT_LIMIT;
            const data = await BillingRefundService.getRefundRequests(
                status as string, refund_type as string, reason_category as string,
                patient_id as string, date_from as string, date_to as string, page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) { next(error); }
    }

    /** Chi tiết */
    static async getRefundById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingRefundService.getRefundById(String(req.params.id));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    // ═══ NHÓM 2: PHÊ DUYỆT ═══

    /** Phê duyệt */
    static async approveRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingRefundService.approveRefund(String(req.params.id), userId);
            res.json({ success: true, message: REFUND_SUCCESS.REQUEST_APPROVED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Từ chối */
    static async rejectRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingRefundService.rejectRefund(String(req.params.id), req.body, userId);
            res.json({ success: true, message: REFUND_SUCCESS.REQUEST_REJECTED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Xử lý hoàn tiền */
    static async processRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingRefundService.processRefund(String(req.params.id), userId);
            res.json({ success: true, message: REFUND_SUCCESS.REQUEST_PROCESSED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Hủy */
    static async cancelRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingRefundService.cancelRefund(String(req.params.id), userId);
            res.json({ success: true, message: REFUND_SUCCESS.REQUEST_CANCELLED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    // ═══ NHÓM 3: ĐIỀU CHỈNH ═══

    /** Tạo điều chỉnh */
    static async createAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingRefundService.createAdjustment(req.body, userId);
            res.status(201).json({ success: true, message: REFUND_SUCCESS.ADJUSTMENT_CREATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Danh sách điều chỉnh */
    static async getAdjustments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { status, adjustment_type, date_from, date_to } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : REFUND_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : REFUND_CONFIG.DEFAULT_LIMIT;
            const data = await BillingRefundService.getAdjustments(
                status as string, adjustment_type as string,
                date_from as string, date_to as string, page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) { next(error); }
    }

    /** Chi tiết */
    static async getAdjustmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingRefundService.getAdjustmentById(String(req.params.id));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Phê duyệt điều chỉnh */
    static async approveAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingRefundService.approveAdjustment(String(req.params.id), userId);
            res.json({ success: true, message: REFUND_SUCCESS.ADJUSTMENT_APPROVED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Áp dụng điều chỉnh */
    static async applyAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingRefundService.applyAdjustment(String(req.params.id), userId);
            res.json({ success: true, message: REFUND_SUCCESS.ADJUSTMENT_APPLIED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Từ chối điều chỉnh */
    static async rejectAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingRefundService.rejectAdjustment(String(req.params.id), req.body, userId);
            res.json({ success: true, message: REFUND_SUCCESS.ADJUSTMENT_REJECTED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    // ═══ NHÓM 4: DASHBOARD & TRACKING ═══

    /** Dashboard */
    static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingRefundService.getDashboard();
            res.json({ success: true, data });
        } catch (error: any) { next(error); }
    }

    /** Timeline */
    static async getRefundTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingRefundService.getRefundTimeline(String(req.params.id));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Lịch sử GD */
    static async getTransactionHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingRefundService.getTransactionHistory(String(req.params.txnId));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }
}
