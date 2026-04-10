import { Request, Response, NextFunction } from 'express';
import { BillingOfflinePaymentService } from '../../services/Billing/billing-offline-payment.service';
import { OFFLINE_PAYMENT_CONFIG } from '../../constants/billing-offline-payment.constant';

export class BillingOfflinePaymentController {

    // ═══ NHÓM 1: THANH TOÁN TẠI QUẦY ═══

    /** Thanh toán tại quầy */
    static async processPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const cashierId = (req as any).auth?.user_id;
            const data = await BillingOfflinePaymentService.processOfflinePayment(req.body, cashierId);
            res.status(201).json({ success: true, message: 'Thanh toán tại quầy thành công.', data });
        } catch (error: any) {
            console.error('[Offline Payment Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Hủy giao dịch (VOID) */
    static async voidTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const cashierId = (req as any).auth?.user_id;
            const data = await BillingOfflinePaymentService.voidTransaction(
                String(req.params.transactionId), req.body, cashierId
            );
            res.json({ success: true, message: 'Hủy giao dịch thành công.', data });
        } catch (error: any) {
            console.error('[Void Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Danh sách giao dịch tại quầy */
    static async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { shift_id, cashier_id, payment_method, terminal_id, status, date_from, date_to } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : OFFLINE_PAYMENT_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : OFFLINE_PAYMENT_CONFIG.DEFAULT_LIMIT;
            const data = await BillingOfflinePaymentService.getOfflineTransactions(
                shift_id as string, cashier_id as string, payment_method as string,
                terminal_id as string, status as string,
                date_from as string, date_to as string, page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) {
            console.error('[Get Transactions Error]:', error);
            next(error);
        }
    }

    // ═══ NHÓM 2: POS TERMINALS ═══

    /** Đăng ký thiết bị POS */
    static async createTerminal(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingOfflinePaymentService.createTerminal(req.body, userId);
            res.status(201).json({ success: true, message: 'Đăng ký thiết bị POS thành công.', data });
        } catch (error: any) {
            console.error('[Create Terminal Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Cập nhật thiết bị POS */
    static async updateTerminal(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingOfflinePaymentService.updateTerminal(String(req.params.terminalId), req.body);
            res.json({ success: true, message: 'Cập nhật thiết bị POS thành công.', data });
        } catch (error: any) {
            console.error('[Update Terminal Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Danh sách POS */
    static async getTerminals(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { branch_id, is_active } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : OFFLINE_PAYMENT_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : OFFLINE_PAYMENT_CONFIG.DEFAULT_LIMIT;
            const data = await BillingOfflinePaymentService.getTerminals(
                branch_id as string,
                is_active !== undefined ? is_active === 'true' : undefined,
                page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) {
            console.error('[Get Terminals Error]:', error);
            next(error);
        }
    }

    /** Chi tiết POS */
    static async getTerminalById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingOfflinePaymentService.getTerminalById(String(req.params.terminalId));
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[Get Terminal Error]:', error);
            if (error.code) {
                res.status(404).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Bật/tắt POS */
    static async toggleTerminal(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingOfflinePaymentService.toggleTerminalStatus(String(req.params.terminalId));
            res.json({ success: true, message: 'Cập nhật trạng thái thiết bị POS thành công.', data });
        } catch (error: any) {
            console.error('[Toggle Terminal Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    // ═══ NHÓM 3: BIÊN LAI ═══

    /** Biên lai theo giao dịch */
    static async getReceiptByTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingOfflinePaymentService.getReceiptByTransaction(String(req.params.transactionId));
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[Get Receipt Error]:', error);
            if (error.code) {
                res.status(404).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Chi tiết biên lai */
    static async getReceiptById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingOfflinePaymentService.getReceiptById(String(req.params.receiptId));
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[Get Receipt Error]:', error);
            if (error.code) {
                res.status(404).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** In lại biên lai */
    static async reprintReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingOfflinePaymentService.reprintReceipt(String(req.params.receiptId));
            res.json({ success: true, message: 'In lại biên lai thành công.', data });
        } catch (error: any) {
            console.error('[Reprint Receipt Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    // ═══ NHÓM 4: CA THU NGÂN MỞ RỘNG ═══

    /** Kê khai mệnh giá tiền */
    static async submitCashDenomination(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { denominations } = req.body;
            const data = await BillingOfflinePaymentService.submitCashDenomination(
                String(req.params.shiftId), denominations
            );
            res.json({ success: true, message: 'Kê khai mệnh giá tiền thành công.', data });
        } catch (error: any) {
            console.error('[Cash Denomination Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Giao dịch trong ca */
    static async getShiftTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingOfflinePaymentService.getShiftTransactions(String(req.params.shiftId));
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[Shift Transactions Error]:', error);
            if (error.code) {
                res.status(404).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Tổng kết ca */
    static async getShiftSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingOfflinePaymentService.getShiftSummary(String(req.params.shiftId));
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[Shift Summary Error]:', error);
            if (error.code) {
                res.status(404).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    // ═══ NHÓM 5: BÁO CÁO ═══

    /** Báo cáo cuối ngày */
    static async getDailyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { report_date, facility_id, branch_id } = req.query;
            const data = await BillingOfflinePaymentService.getDailyReport(
                report_date as string, facility_id as string, branch_id as string
            );
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[Daily Report Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Hiệu suất thu ngân */
    static async getCashierPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { cashier_id, date_from, date_to } = req.query;
            const data = await BillingOfflinePaymentService.getCashierPerformance(
                cashier_id as string, date_from as string, date_to as string
            );
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[Cashier Performance Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }
}
