import { Request, Response } from 'express';
import { TeleResultService } from '../../services/Remote Consultation/tele-result.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { TELE_RESULT_SUCCESS, REMOTE_CONSULTATION_CONFIG } from '../../constants/remote-consultation.constant';

/**
 * Controller cho Module 8.5 — Ghi nhận kết quả khám từ xa
 * 14 handler chia 4 nhóm
 */
export class TeleResultController {

    // ═══ NHÓM 1: Ghi nhận kết quả ═══

    /** POST /results/:consultationId */
    static async createResult(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const result = await TeleResultService.createResult(String(req.params.consultationId), req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_RESULT_SUCCESS.RESULT_CREATED, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** PUT /results/:consultationId */
    static async updateResult(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleResultService.updateResult(String(req.params.consultationId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RESULT_SUCCESS.RESULT_UPDATED, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /results/:consultationId */
    static async getResult(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleResultService.getResult(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** PUT /results/:consultationId/complete */
    static async completeResult(req: Request, res: Response): Promise<void> {
        try {
            await TeleResultService.completeResult(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RESULT_SUCCESS.RESULT_COMPLETED });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** PUT /results/:consultationId/sign */
    static async signResult(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            await TeleResultService.signResult(String(req.params.consultationId), userId, req.body?.signature_notes);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RESULT_SUCCESS.RESULT_SIGNED });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 2: Triệu chứng & Sinh hiệu ═══

    /** PUT /results/:consultationId/symptoms */
    static async updateSymptoms(req: Request, res: Response): Promise<void> {
        try {
            await TeleResultService.updateSymptoms(String(req.params.consultationId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RESULT_SUCCESS.SYMPTOMS_UPDATED });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** PUT /results/:consultationId/vitals */
    static async updateVitals(req: Request, res: Response): Promise<void> {
        try {
            await TeleResultService.updateVitals(String(req.params.consultationId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RESULT_SUCCESS.VITALS_UPDATED });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 3: Chuyển tuyến & Tái khám ═══

    /** PUT /results/:consultationId/referral */
    static async updateReferral(req: Request, res: Response): Promise<void> {
        try {
            await TeleResultService.updateReferral(String(req.params.consultationId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RESULT_SUCCESS.REFERRAL_UPDATED });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** PUT /results/:consultationId/follow-up */
    static async updateFollowUp(req: Request, res: Response): Promise<void> {
        try {
            await TeleResultService.updateFollowUp(String(req.params.consultationId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_RESULT_SUCCESS.FOLLOW_UP_UPDATED });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 4: Tra cứu & Thống kê ═══

    /** GET /results */
    static async listResults(req: Request, res: Response): Promise<void> {
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
            const result = await TeleResultService.listResults(filters);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /results/patient/:patientId */
    static async getPatientResults(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleResultService.getPatientResults(String(req.params.patientId), page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /results/unsigned */
    static async getUnsigned(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleResultService.getUnsigned(userId, page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /results/follow-ups */
    static async getFollowUps(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleResultService.getFollowUps(userId, page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /results/:consultationId/summary */
    static async getSummary(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleResultService.getSummary(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }
}
