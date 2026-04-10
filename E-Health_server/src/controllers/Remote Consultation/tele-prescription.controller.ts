import { Request, Response } from 'express';
import { TelePrescriptionService } from '../../services/Remote Consultation/tele-prescription.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { TELE_RX_SUCCESS, REMOTE_CONSULTATION_CONFIG } from '../../constants/remote-consultation.constant';

/**
 * Controller cho Module 8.6 — Kê đơn & chỉ định từ xa
 * 14 handler chia 4 nhóm
 */
export class TelePrescriptionController {

    // ═══ NHÓM 1: Kê đơn ═══

    /** POST /prescriptions/:consultationId */
    static async createPrescription(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const result = await TelePrescriptionService.createPrescription(String(req.params.consultationId), userId, req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_RX_SUCCESS.PRESCRIPTION_CREATED, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** POST /prescriptions/:consultationId/items */
    static async addItem(req: Request, res: Response): Promise<void> {
        try {
            const result = await TelePrescriptionService.addItem(String(req.params.consultationId), req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_RX_SUCCESS.ITEM_ADDED, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** DELETE /prescriptions/:consultationId/items/:detailId */
    static async removeItem(req: Request, res: Response): Promise<void> {
        try {
            await TelePrescriptionService.removeItem(String(req.params.consultationId), String(req.params.detailId));
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RX_SUCCESS.ITEM_REMOVED });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** PUT /prescriptions/:consultationId/prescribe */
    static async prescribe(req: Request, res: Response): Promise<void> {
        try {
            await TelePrescriptionService.prescribe(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RX_SUCCESS.PRESCRIBED });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /prescriptions/:consultationId */
    static async getDetail(req: Request, res: Response): Promise<void> {
        try {
            const result = await TelePrescriptionService.getDetail(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 2: Gửi đơn & Kiểm soát ═══

    /** PUT /prescriptions/:consultationId/send */
    static async sendToPatient(req: Request, res: Response): Promise<void> {
        try {
            await TelePrescriptionService.sendToPatient(String(req.params.consultationId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RX_SUCCESS.SENT_TO_PATIENT });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /prescriptions/:consultationId/stock-check */
    static async checkStock(req: Request, res: Response): Promise<void> {
        try {
            const result = await TelePrescriptionService.checkStock(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RX_SUCCESS.STOCK_CHECKED, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /prescriptions/drug-restrictions */
    static async getDrugRestrictions(req: Request, res: Response): Promise<void> {
        try {
            const result = await TelePrescriptionService.getDrugRestrictions();
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 3: Chỉ định XN & Tái khám ═══

    /** POST /prescriptions/:consultationId/lab-orders */
    static async createLabOrder(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const result = await TelePrescriptionService.createLabOrder(String(req.params.consultationId), req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_RX_SUCCESS.LAB_ORDER_CREATED, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /prescriptions/:consultationId/lab-orders */
    static async getLabOrders(req: Request, res: Response): Promise<void> {
        try {
            const result = await TelePrescriptionService.getLabOrders(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** PUT /prescriptions/:consultationId/referral */
    static async updateReferral(req: Request, res: Response): Promise<void> {
        try {
            await TelePrescriptionService.updateReferral(String(req.params.consultationId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RX_SUCCESS.REFERRAL_UPDATED });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 4: Tra cứu ═══

    /** GET /prescriptions */
    static async listPrescriptions(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE;
            const limit = Math.min(parseInt(req.query.limit as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_LIMIT, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const filters = {
                status: req.query.status as string,
                doctor_id: req.query.doctor_id as string,
                keyword: req.query.keyword as string,
                page,
                limit,
            };
            const result = await TelePrescriptionService.listPrescriptions(filters);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /prescriptions/patient/:patientId */
    static async getPatientPrescriptions(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TelePrescriptionService.getPatientPrescriptions(String(req.params.patientId), page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /prescriptions/:consultationId/summary */
    static async getSummary(req: Request, res: Response): Promise<void> {
        try {
            const result = await TelePrescriptionService.getSummary(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }
}
