import { Request, Response, NextFunction } from 'express';
import { BillingDocumentService } from '../../services/Billing/billing-document.service';
import { BILLING_DOC_CONFIG, BILLING_DOC_SUCCESS } from '../../constants/billing-document.constant';

export class BillingDocumentController {

    // ═══ NHÓM 1: HÓA ĐƠN ĐIỆN TỬ ═══

    /** Tạo HĐĐT */
    static async createEInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingDocumentService.createEInvoice(req.body, userId);
            res.status(201).json({ success: true, message: BILLING_DOC_SUCCESS.EINVOICE_CREATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Tạo HĐ VAT */
    static async createVATInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingDocumentService.createVATInvoice(req.body, userId);
            res.status(201).json({ success: true, message: BILLING_DOC_SUCCESS.EINVOICE_VAT_CREATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Phát hành HĐĐT */
    static async issueEInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingDocumentService.issueEInvoice(String(req.params.id));
            res.json({ success: true, message: BILLING_DOC_SUCCESS.EINVOICE_ISSUED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Ký số HĐĐT */
    static async signEInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingDocumentService.signEInvoice(String(req.params.id), userId);
            res.json({ success: true, message: BILLING_DOC_SUCCESS.EINVOICE_SIGNED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Gửi HĐĐT */
    static async sendEInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingDocumentService.sendEInvoice(String(req.params.id));
            res.json({ success: true, message: BILLING_DOC_SUCCESS.EINVOICE_SENT, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Hủy HĐĐT */
    static async cancelEInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingDocumentService.cancelEInvoice(String(req.params.id), req.body, userId);
            res.json({ success: true, message: BILLING_DOC_SUCCESS.EINVOICE_CANCELLED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Thay thế HĐĐT */
    static async replaceEInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingDocumentService.replaceEInvoice(String(req.params.id), req.body, userId);
            res.status(201).json({ success: true, message: BILLING_DOC_SUCCESS.EINVOICE_REPLACED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Điều chỉnh HĐĐT */
    static async adjustEInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingDocumentService.adjustEInvoice(String(req.params.id), req.body, userId);
            res.status(201).json({ success: true, message: BILLING_DOC_SUCCESS.EINVOICE_ADJUSTED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Chi tiết HĐĐT */
    static async getEInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingDocumentService.getEInvoiceById(String(req.params.id));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Danh sách HĐĐT */
    static async getEInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { facility_id, status, invoice_type, date_from, date_to, search } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : BILLING_DOC_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : BILLING_DOC_CONFIG.DEFAULT_LIMIT;
            const data = await BillingDocumentService.getEInvoices(
                facility_id as string, status as string, invoice_type as string,
                date_from as string, date_to as string, search as string, page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) { next(error); }
    }

    /** Tra cứu theo mã CQT */
    static async lookupEInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingDocumentService.getEInvoiceByLookupCode(String(req.params.code));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    // ═══ NHÓM 2: IN HÓA ĐƠN ═══

    /** Dữ liệu in HĐĐT */
    static async getPrintData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingDocumentService.generatePrintData(String(req.params.id));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Lịch sử in */
    static async getPrintHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingDocumentService.getPrintHistory(String(req.params.id));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    // ═══ NHÓM 3: TRA CỨU ═══

    /** Tìm kiếm nâng cao */
    static async searchInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const page = req.query.page ? parseInt(String(req.query.page)) : BILLING_DOC_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : BILLING_DOC_CONFIG.DEFAULT_LIMIT;
            const filters = {
                search: req.query.search as string | undefined,
                invoice_code: req.query.invoice_code as string | undefined,
                e_invoice_number: req.query.e_invoice_number as string | undefined,
                lookup_code: req.query.lookup_code as string | undefined,
                patient_id: req.query.patient_id as string | undefined,
                facility_id: req.query.facility_id as string | undefined,
                status: req.query.status as string | undefined,
                invoice_type: req.query.invoice_type as string | undefined,
                date_from: req.query.date_from as string | undefined,
                date_to: req.query.date_to as string | undefined,
                amount_from: req.query.amount_from ? parseFloat(String(req.query.amount_from)) : undefined,
                amount_to: req.query.amount_to ? parseFloat(String(req.query.amount_to)) : undefined,
            };
            const data = await BillingDocumentService.searchInvoices(filters, page, limit);
            res.json({ success: true, ...data });
        } catch (error: any) { next(error); }
    }

    /** Timeline hóa đơn */
    static async getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingDocumentService.getInvoiceTimeline(String(req.params.invoiceId));
            res.json({ success: true, data });
        } catch (error: any) { next(error); }
    }

    // ═══ NHÓM 4: CHỨNG TỪ ═══

    /** Upload chứng từ */
    static async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingDocumentService.uploadDocument(req.body, userId);
            res.status(201).json({ success: true, message: BILLING_DOC_SUCCESS.DOCUMENT_UPLOADED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Danh sách chứng từ */
    static async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { document_type, invoice_id, e_invoice_id, date_from, date_to, is_archived } = req.query;
            const page = req.query.page ? parseInt(String(req.query.page)) : BILLING_DOC_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : BILLING_DOC_CONFIG.DEFAULT_LIMIT;
            const data = await BillingDocumentService.getDocuments(
                document_type as string, invoice_id as string, e_invoice_id as string,
                date_from as string, date_to as string,
                is_archived === 'true', page, limit
            );
            res.json({ success: true, ...data });
        } catch (error: any) { next(error); }
    }

    /** Chi tiết chứng từ */
    static async getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingDocumentService.getDocumentById(String(req.params.id));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Xóa chứng từ */
    static async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await BillingDocumentService.deleteDocument(String(req.params.id));
            res.json({ success: true, message: BILLING_DOC_SUCCESS.DOCUMENT_DELETED });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Lưu trữ hàng loạt */
    static async archiveDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { document_ids } = req.body;
            const count = await BillingDocumentService.archiveDocuments(document_ids);
            res.json({ success: true, message: BILLING_DOC_SUCCESS.DOCUMENTS_ARCHIVED, archived_count: count });
        } catch (error: any) { next(error); }
    }

    // ═══ NHÓM 5: CẤU HÌNH HĐĐT ═══

    /** Lấy cấu hình HĐĐT */
    static async getConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = await BillingDocumentService.getConfig(String(req.params.facilityId));
            res.json({ success: true, data });
        } catch (error: any) {
            if (error.code) { res.status(404).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }

    /** Tạo/cập nhật cấu hình */
    static async upsertConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).auth?.user_id;
            const data = await BillingDocumentService.upsertConfig(String(req.params.facilityId), req.body, userId);
            res.json({ success: true, message: BILLING_DOC_SUCCESS.CONFIG_UPDATED, data });
        } catch (error: any) {
            if (error.code) { res.status(400).json({ success: false, code: error.code, message: error.message }); }
            else { next(error); }
        }
    }
}
