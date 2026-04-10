import { Request, Response } from 'express';
import { HealthProfileService } from '../../services/EHR/health-profile.service';
import { HEALTH_PROFILE_SUCCESS, HEALTH_PROFILE_CONFIG } from '../../constants/health-profile.constant';

export class HealthProfileController {

    /** API 1: Lấy hồ sơ sức khỏe tổng hợp */
    static async getFullProfile(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const profile = await HealthProfileService.getFullProfile(patientId);
            res.status(200).json({
                success: true,
                message: HEALTH_PROFILE_SUCCESS.PROFILE_FETCHED,
                data: profile,
            });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 2: Tóm tắt sức khỏe nhanh */
    static async getHealthSummary(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const summary = await HealthProfileService.getHealthSummary(patientId);
            res.status(200).json({
                success: true,
                message: HEALTH_PROFILE_SUCCESS.SUMMARY_FETCHED,
                data: summary,
            });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 3: Sinh hiệu gần nhất */
    static async getLatestVitals(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const vitals = await HealthProfileService.getLatestVitals(patientId);
            res.status(200).json({
                success: true,
                message: HEALTH_PROFILE_SUCCESS.VITALS_FETCHED,
                data: vitals,
            });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 4: Bệnh lý đang hoạt động */
    static async getActiveConditions(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const conditions = await HealthProfileService.getActiveConditions(patientId);
            res.status(200).json({
                success: true,
                message: HEALTH_PROFILE_SUCCESS.CONDITIONS_FETCHED,
                data: conditions,
            });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 5: Danh sách dị ứng */
    static async getAllergies(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const allergies = await HealthProfileService.getAllergies(patientId);
            res.status(200).json({
                success: true,
                message: HEALTH_PROFILE_SUCCESS.ALLERGIES_FETCHED,
                data: allergies,
            });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 6: Thuốc đang dùng */
    static async getCurrentMedications(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const medications = await HealthProfileService.getCurrentMedications(patientId);
            res.status(200).json({
                success: true,
                message: HEALTH_PROFILE_SUCCESS.MEDICATIONS_FETCHED,
                data: medications,
            });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 7: Lịch sử chẩn đoán */
    static async getDiagnosisHistory(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const page = parseInt(req.query.page as string) || HEALTH_PROFILE_CONFIG.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || HEALTH_PROFILE_CONFIG.DEFAULT_LIMIT;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;

            const result = await HealthProfileService.getDiagnosisHistory(
                patientId, page, limit, fromDate, toDate
            );
            res.status(200).json({
                success: true,
                message: HEALTH_PROFILE_SUCCESS.DIAGNOSIS_HISTORY_FETCHED,
                data: result,
            });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 8: Tình trạng bảo hiểm */
    static async getInsuranceStatus(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const insurance = await HealthProfileService.getInsuranceStatus(patientId);
            res.status(200).json({
                success: true,
                message: HEALTH_PROFILE_SUCCESS.INSURANCE_STATUS_FETCHED,
                data: insurance,
            });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 9: Lấy cảnh báo y tế */
    static async getAlerts(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const alerts = await HealthProfileService.getAlerts(patientId);
            res.status(200).json({
                success: true,
                message: HEALTH_PROFILE_SUCCESS.ALERTS_FETCHED,
                data: alerts,
            });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 10: Thêm cảnh báo thủ công */
    static async createAlert(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const userId = (req as any).auth?.user_id;
            const alert = await HealthProfileService.createManualAlert(patientId, userId, req.body);
            res.status(201).json({
                success: true,
                message: HEALTH_PROFILE_SUCCESS.ALERT_CREATED,
                data: alert,
            });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('bắt buộc') || error.message?.includes('không hợp lệ') ? 400
                : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 11: Cập nhật cảnh báo */
    static async updateAlert(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const alertId = req.params.alertId as string;
            const alert = await HealthProfileService.updateManualAlert(patientId, alertId, req.body);
            res.status(200).json({
                success: true,
                message: HEALTH_PROFILE_SUCCESS.ALERT_UPDATED,
                data: alert,
            });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('không thuộc') ? 403
                : error.message?.includes('không hợp lệ') ? 400
                : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 12: Xóa cảnh báo */
    static async deleteAlert(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const alertId = req.params.alertId as string;
            await HealthProfileService.deleteManualAlert(patientId, alertId);
            res.status(200).json({
                success: true,
                message: HEALTH_PROFILE_SUCCESS.ALERT_DELETED,
            });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('không thuộc') ? 403
                : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 13: Cập nhật ghi chú EHR */
    static async updateNotes(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const userId = (req as any).auth?.user_id;
            const result = await HealthProfileService.updateEhrNotes(patientId, userId, req.body);
            res.status(200).json({
                success: true,
                message: HEALTH_PROFILE_SUCCESS.NOTES_UPDATED,
                data: result,
            });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('không hợp lệ') ? 400
                : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }
}
