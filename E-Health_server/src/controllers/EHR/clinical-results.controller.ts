import { Request, Response } from 'express';
import { ClinicalResultsService } from '../../services/EHR/clinical-results.service';
import { CR_SUCCESS } from '../../constants/clinical-results.constant';


export class ClinicalResultsController {

    /** API 1: Danh sách kết quả CLS */
    static async getResults(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const filters = {
                order_type: req.query.order_type as string | undefined,
                service_code: req.query.service_code as string | undefined,
                status: req.query.status as string | undefined,
                from_date: req.query.from_date as string | undefined,
                to_date: req.query.to_date as string | undefined,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
            };
            const data = await ClinicalResultsService.getResults(patientId, filters);
            res.status(200).json({ success: true, message: CR_SUCCESS.RESULTS_FETCHED, ...data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 2: Chi tiết kết quả */
    static async getResultDetail(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const orderId = req.params.orderId as string;
            const data = await ClinicalResultsService.getResultDetail(patientId, orderId);
            res.status(200).json({ success: true, message: CR_SUCCESS.RESULT_DETAIL_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('không thuộc') ? 403 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 3: Kết quả theo encounter */
    static async getResultsByEncounter(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const encounterId = req.params.encounterId as string;
            const data = await ClinicalResultsService.getResultsByEncounter(patientId, encounterId);
            res.status(200).json({ success: true, message: CR_SUCCESS.ENCOUNTER_RESULTS_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('không thuộc') ? 403 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 4: Xu hướng */
    static async getTrends(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const serviceCode = req.query.service_code as string;
            const data = await ClinicalResultsService.getTrends(patientId, serviceCode);
            res.status(200).json({ success: true, message: CR_SUCCESS.TRENDS_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('bắt buộc') ? 400 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 5: Thống kê tổng quan */
    static async getSummary(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const data = await ClinicalResultsService.getSummary(patientId);
            res.status(200).json({ success: true, message: CR_SUCCESS.SUMMARY_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 6: File đính kèm */
    static async getAttachments(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const data = await ClinicalResultsService.getAttachments(patientId);
            res.status(200).json({ success: true, message: CR_SUCCESS.ATTACHMENTS_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 7: Kết quả bất thường */
    static async getAbnormalResults(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const data = await ClinicalResultsService.getAbnormalResults(patientId);
            res.status(200).json({ success: true, message: CR_SUCCESS.ABNORMAL_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }
}
