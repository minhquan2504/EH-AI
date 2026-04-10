import { Request, Response, NextFunction } from 'express';
import { MedicalHistoryService } from '../../services/Patient Management/medical-history.service';
import { MEDICAL_HISTORY_CONFIG } from '../../constants/medical-history.constant';

export class MedicalHistoryController {
    /**
     * Lấy danh sách lượt khám
     */
    static async getEncounters(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const {
                patient_id, doctor_id, type, status,
                from, to, page, limit
            } = req.query as Record<string, string>;

            const data = await MedicalHistoryService.getEncounters(
                patient_id,
                doctor_id,
                type,
                status,
                from,
                to,
                page ? parseInt(page) : MEDICAL_HISTORY_CONFIG.DEFAULT_PAGE,
                limit ? parseInt(limit) : MEDICAL_HISTORY_CONFIG.DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy chi tiết đầy đủ lượt khám
     */
    static async getEncounterDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { encounterId } = req.params as { encounterId: string };
            const data = await MedicalHistoryService.getEncounterDetail(encounterId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tra cứu lần khám gần nhất
     */
    static async getLatestEncounter(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { patientId } = req.params as { patientId: string };
            const data = await MedicalHistoryService.getLatestEncounter(patientId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xem dòng thời gian sức khỏe
     */
    static async getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { patientId } = req.params as { patientId: string };
            const { from, to, limit } = req.query as Record<string, string>;

            const data = await MedicalHistoryService.getTimeline(
                patientId, from, to,
                limit ? parseInt(limit) : MEDICAL_HISTORY_CONFIG.TIMELINE_DEFAULT_LIMIT
            );

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tổng hợp lịch sử bệnh nhân
     */
    static async getPatientSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { patientId } = req.params as { patientId: string };
            const data = await MedicalHistoryService.getPatientSummary(patientId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
}
