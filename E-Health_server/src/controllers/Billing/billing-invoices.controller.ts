import { Request, Response, NextFunction } from 'express';
import { BillingInvoiceService } from '../../services/Billing/billing-invoices.service';
import {
    BILLING_INVOICE_CONFIG,
} from '../../constants/billing-invoices.constant';

export class BillingInvoiceController {

    // INVOICES

    /** Tạo hóa đơn mới */
    static async createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingInvoiceService.createInvoice(req.body, userId);
            res.status(201).json({ success: true, message: 'Tạo hóa đơn thành công.', data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Tạo HĐ tự động từ encounter */
    static async generateInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const encounterId = String(req.params.encounterId);
            const data = await BillingInvoiceService.generateInvoiceFromEncounter(encounterId, userId);
            res.status(201).json({ success: true, message: 'Tạo hóa đơn tự động thành công.', data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Danh sách hóa đơn */
    static async getInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { facility_id, patient_id, status, date_from, date_to, search } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : BILLING_INVOICE_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : BILLING_INVOICE_CONFIG.DEFAULT_LIMIT;
            const data = await BillingInvoiceService.getInvoices(
                facility_id as string, patient_id as string, status as string,
                date_from as string, date_to as string, search as string,
                page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            next(error);
        }
    }

    /** Chi tiết hóa đơn */
    static async getInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingInvoiceService.getInvoiceById(String(req.params.invoiceId));
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(404).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Cập nhật hóa đơn */
    static async updateInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingInvoiceService.updateInvoice(String(req.params.invoiceId), req.body, userId);
            res.json({ success: true, message: 'Cập nhật hóa đơn thành công.', data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Hủy hóa đơn */
    static async cancelInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const { reason } = req.body;
            const data = await BillingInvoiceService.cancelInvoice(String(req.params.invoiceId), reason, userId);
            res.json({ success: true, message: 'Hủy hóa đơn thành công.', data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Lấy HĐ theo encounter */
    static async getByEncounter(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingInvoiceService.getInvoiceByEncounter(String(req.params.encounterId));
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(404).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Lịch sử HĐ bệnh nhân */
    static async getByPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const page = req.query.page ? parseInt(String(req.query.page)) : BILLING_INVOICE_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : BILLING_INVOICE_CONFIG.DEFAULT_LIMIT;
            const data = await BillingInvoiceService.getInvoicesByPatient(String(req.params.patientId), page, limit);
            res.json({ success: true, ...data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(404).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    // INVOICE DETAILS

    /** Thêm dòng chi tiết */
    static async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingInvoiceService.addInvoiceItem(String(req.params.invoiceId), req.body, userId);
            res.status(201).json({ success: true, message: 'Thêm dòng chi tiết thành công.', data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Sửa dòng chi tiết */
    static async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingInvoiceService.updateInvoiceItem(
                String(req.params.invoiceId), String(req.params.itemId), req.body, userId
            );
            res.json({ success: true, message: 'Cập nhật dòng chi tiết thành công.', data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Xóa dòng chi tiết */
    static async deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            await BillingInvoiceService.deleteInvoiceItem(String(req.params.invoiceId), String(req.params.itemId), userId);
            res.json({ success: true, message: 'Xóa dòng chi tiết thành công.' });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Tính lại tổng tiền */
    static async recalculate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingInvoiceService.recalculateInvoice(String(req.params.invoiceId));
            res.json({ success: true, message: 'Tính lại tổng tiền thành công.', data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    // PAYMENTS

    /** Ghi nhận thanh toán */
    static async createPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const cashierId = (req as any).auth?.user_id;
            const data = await BillingInvoiceService.processPayment(req.body, cashierId);
            res.status(201).json({ success: true, message: 'Ghi nhận thanh toán thành công.', data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Chi tiết giao dịch */
    static async getPaymentDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingInvoiceService.getPaymentById(String(req.params.paymentId));
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(404).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Giao dịch theo HĐ */
    static async getPaymentsByInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingInvoiceService.getPaymentsByInvoice(String(req.params.invoiceId));
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(404).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Hoàn tiền */
    static async refund(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const cashierId = (req as any).auth?.user_id;
            const data = await BillingInvoiceService.processRefund(String(req.params.paymentId), req.body, cashierId);
            res.status(201).json({ success: true, message: 'Hoàn tiền thành công.', data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    // CASHIER SHIFTS

    /** Mở ca thu ngân */
    static async openShift(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const cashierId = (req as any).auth?.user_id;
            const data = await BillingInvoiceService.openShift(req.body, cashierId);
            res.status(201).json({ success: true, message: 'Mở ca thu ngân thành công.', data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Đóng ca thu ngân */
    static async closeShift(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const cashierId = (req as any).auth?.user_id;
            const data = await BillingInvoiceService.closeShift(String(req.params.shiftId), req.body, cashierId);
            res.json({ success: true, message: 'Đóng ca thu ngân thành công.', data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(400).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Chi tiết ca */
    static async getShiftDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingInvoiceService.getShiftById(String(req.params.shiftId));
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(404).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Danh sách ca */
    static async getShifts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { cashier_id, status, date_from, date_to } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : BILLING_INVOICE_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : BILLING_INVOICE_CONFIG.DEFAULT_LIMIT;
            const data = await BillingInvoiceService.getShifts(
                cashier_id as string, status as string, date_from as string, date_to as string,
                page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            next(error);
        }
    }

    // STATISTICS & INSURANCE

    /** Thống kê doanh thu */
    static async getRevenueSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingInvoiceService.getRevenueSummary(
                String(req.params.facilityId),
                req.query.date_from as string,
                req.query.date_to as string
            );
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(404).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }

    /** Thông tin claim BHYT */
    static async getInsuranceClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingInvoiceService.getInsuranceClaim(String(req.params.invoiceId));
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('[Global Error]:', error);
            if (error.code) {
                res.status(404).json({ success: false, code: error.code, message: error.message });
            } else { next(error); }
        }
    }
}
