import { Request, Response } from 'express';
import { TeleQualityService } from '../../services/Remote Consultation/tele-quality.service';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { TELE_QA_SUCCESS, REMOTE_CONSULTATION_CONFIG } from '../../constants/remote-consultation.constant';

/**
 * Controller cho Module 8.8 — Quản lý chất lượng & đánh giá
 * 14 handler chia 4 nhóm
 */
export class TeleQualityController {

    // ═══ NHÓM 1: Đánh giá ═══

    /** POST /quality/reviews/:consultationId */
    static async createReview(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            const result = await TeleQualityService.createReview(String(req.params.consultationId), userId, req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_QA_SUCCESS.REVIEW_CREATED, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /quality/reviews/:consultationId */
    static async getReview(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleQualityService.getReview(String(req.params.consultationId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /quality/reviews */
    static async listReviews(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_PAGE;
            const limit = Math.min(parseInt(req.query.limit as string) || REMOTE_CONSULTATION_CONFIG.DEFAULT_LIMIT, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const filters = {
                doctor_id: req.query.doctor_id as string,
                min_rating: req.query.min_rating ? parseInt(req.query.min_rating as string) : undefined,
                max_rating: req.query.max_rating ? parseInt(req.query.max_rating as string) : undefined,
                keyword: req.query.keyword as string,
                page,
                limit,
            };
            const result = await TeleQualityService.listReviews(filters);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /quality/reviews/doctor/:doctorId */
    static async getDoctorReviews(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleQualityService.getDoctorReviews(String(req.params.doctorId), page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 2: Metrics ═══

    /** GET /quality/metrics/doctor/:doctorId */
    static async getDoctorMetrics(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleQualityService.getDoctorMetrics(String(req.params.doctorId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /quality/metrics/overview */
    static async getOverview(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleQualityService.getSystemOverview();
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /quality/metrics/connection */
    static async getConnectionStats(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleQualityService.getConnectionStats();
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /quality/metrics/trends */
    static async getTrends(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleQualityService.getTrends();
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 3: Cảnh báo ═══

    /** GET /quality/alerts */
    static async listAlerts(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, REMOTE_CONSULTATION_CONFIG.MAX_LIMIT);
            const result = await TeleQualityService.listAlerts(req.query.status as string, page, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: { total: result.total, page, limit } });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** POST /quality/alerts */
    static async createAlert(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleQualityService.createAlert(req.body);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: TELE_QA_SUCCESS.ALERT_CREATED, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** PUT /quality/alerts/:alertId/resolve */
    static async resolveAlert(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;
            await TeleQualityService.resolveAlert(String(req.params.alertId), userId, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: TELE_QA_SUCCESS.ALERT_RESOLVED });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /quality/alerts/stats */
    static async getAlertStats(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleQualityService.getAlertStats();
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    // ═══ NHÓM 4: Báo cáo ═══

    /** GET /quality/reports/doctor/:doctorId */
    static async getDoctorReport(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleQualityService.getDoctorReport(String(req.params.doctorId));
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }

    /** GET /quality/reports/summary */
    static async getSystemReport(req: Request, res: Response): Promise<void> {
        try {
            const result = await TeleQualityService.getSystemReport();
            res.status(HTTP_STATUS.OK).json({ success: true, data: result });
        } catch (error: any) {
            res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, code: error.code, message: error.message });
        }
    }
}
