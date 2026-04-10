import { Request, Response } from 'express';
import { VitalSignsService } from '../../services/EHR/vital-signs.service';
import { VS_SUCCESS } from '../../constants/vital-signs.constant';


export class VitalSignsController {

    /** API 1: Lịch sử sinh hiệu */
    static async getVitals(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const filters = {
                from_date: req.query.from_date as string | undefined,
                to_date: req.query.to_date as string | undefined,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
            };
            const data = await VitalSignsService.getVitals(patientId, filters);
            res.status(200).json({ success: true, message: VS_SUCCESS.VITALS_FETCHED, ...data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 2: Sinh hiệu mới nhất */
    static async getLatestVitals(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const data = await VitalSignsService.getLatestVitals(patientId);
            res.status(200).json({ success: true, message: VS_SUCCESS.LATEST_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 3: Xu hướng */
    static async getTrends(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const metricType = req.query.metric_type as string;
            const data = await VitalSignsService.getTrends(patientId, metricType);
            res.status(200).json({ success: true, message: VS_SUCCESS.TRENDS_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('bắt buộc') ? 400 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 4: Bất thường */
    static async getAbnormalVitals(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const data = await VitalSignsService.getAbnormalVitals(patientId);
            res.status(200).json({ success: true, message: VS_SUCCESS.ABNORMAL_FETCHED, data, total: data.length });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 5: Tổng hợp */
    static async getSummary(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const data = await VitalSignsService.getSummary(patientId);
            res.status(200).json({ success: true, message: VS_SUCCESS.SUMMARY_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 6: DS health metrics */
    static async getHealthMetrics(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const filters = {
                metric_code: req.query.metric_code as string | undefined,
                source_type: req.query.source_type as string | undefined,
                from_date: req.query.from_date as string | undefined,
                to_date: req.query.to_date as string | undefined,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
            };
            const data = await VitalSignsService.getHealthMetrics(patientId, filters);
            res.status(200).json({ success: true, message: VS_SUCCESS.METRICS_FETCHED, ...data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 7: Thêm chỉ số */
    static async createHealthMetric(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const data = await VitalSignsService.createHealthMetric(patientId, req.body);
            res.status(201).json({ success: true, message: VS_SUCCESS.METRIC_CREATED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('bắt buộc') ? 400 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 8: Timeline */
    static async getTimeline(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const data = await VitalSignsService.getTimeline(patientId);
            res.status(200).json({ success: true, message: VS_SUCCESS.TIMELINE_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }
}
