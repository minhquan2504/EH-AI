import { Request, Response } from 'express';
import { TeleFollowUpService } from '../../services/Remote Consultation/tele-followup.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { TELE_FU_SUCCESS, REMOTE_CONSULTATION_CONFIG } from '../../constants/remote-consultation.constant';

/**
 * Controller cho Module 8.7 — Theo dõi sau tư vấn & tái khám từ xa
 * 15 handler chia 4 nhóm
 */
export class TeleFollowUpController {

    // ═══ NHÓM 1: Kế hoạch ═══

    /** POST /follow-ups/plans/:consultationId */
    static async createPlan(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const result = await TeleFollowUpService.createPlan(String(req.params.consultationId), userId, req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_FU_SUCCESS.PLAN_CREATED, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** PUT /follow-ups/plans/:planId */
    static async updatePlan(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleFollowUpService.updatePlan(String(req.params.planId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_FU_SUCCESS.PLAN_UPDATED, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /follow-ups/plans/:planId */
    static async getPlanDetail(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleFollowUpService.getPlanDetail(String(req.params.planId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** PUT /follow-ups/plans/:planId/complete */
    static async completePlan(req: Request, res: Response): Promise<void> {
        try {
            await TeleFollowUpService.completePlan(String(req.params.planId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_FU_SUCCESS.PLAN_COMPLETED });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** PUT /follow-ups/plans/:planId/convert */
    static async convertToPerson(req: Request, res: Response): Promise<void> {
        try {
            await TeleFollowUpService.convertToPerson(String(req.params.planId), req.body.converted_reason || '');
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_FU_SUCCESS.PLAN_CONVERTED });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 2: Diễn biến sức khỏe ═══

    /** POST /follow-ups/plans/:planId/updates */
    static async addHealthUpdate(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const role = (req as any).user?.role;
            const result = await TeleFollowUpService.addHealthUpdate(String(req.params.planId), userId, role, req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_FU_SUCCESS.UPDATE_ADDED, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /follow-ups/plans/:planId/updates */
    static async getHealthUpdates(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleFollowUpService.getHealthUpdates(String(req.params.planId), page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** PUT /follow-ups/updates/:updateId/respond */
    static async respondToUpdate(req: Request, res: Response): Promise<void> {
        try {
            await TeleFollowUpService.respondToUpdate(String(req.params.updateId), req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_FU_SUCCESS.UPDATE_RESPONDED });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /follow-ups/updates/attention */
    static async getAttentionUpdates(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleFollowUpService.getAttentionUpdates(userId, page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 3: Nhắc tái khám ═══

    /** POST /follow-ups/plans/:planId/send-reminder */
    static async sendReminder(req: Request, res: Response): Promise<void> {
        try {
            await TeleFollowUpService.sendReminder(String(req.params.planId));
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_FU_SUCCESS.REMINDER_SENT });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /follow-ups/plans/upcoming */
    static async getUpcomingPlans(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const result = await TeleFollowUpService.getUpcomingPlans(userId);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 4: Tra cứu & Báo cáo ═══

    /** GET /follow-ups/plans */
    static async listPlans(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE;
            const limit = Math.min(parseInt(req.query.limit as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_LIMIT, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const filters = {
                status: req.query.status as string,
                plan_type: req.query.plan_type as string,
                doctor_id: req.query.doctor_id as string,
                keyword: req.query.keyword as string,
                page,
                limit,
            };
            const result = await TeleFollowUpService.listPlans(filters);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /follow-ups/plans/patient/:patientId */
    static async getPatientPlans(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleFollowUpService.getPatientPlans(String(req.params.patientId), page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /follow-ups/plans/:planId/report */
    static async getReport(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleFollowUpService.getReport(String(req.params.planId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /follow-ups/stats */
    static async getStats(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = req.query.doctor_id as string;
            const result = await TeleFollowUpService.getStats(doctorId);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }
}
