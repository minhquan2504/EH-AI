import { Request, Response } from 'express';
import { MedicationTreatmentService } from '../../services/EHR/medication-treatment.service';
import { MT_SUCCESS } from '../../constants/medication-treatment.constant';


export class MedicationTreatmentController {

    /** API 1: Lịch sử đơn thuốc */
    static async getMedicationRecords(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const filters = {
                status: req.query.status as string | undefined,
                from_date: req.query.from_date as string | undefined,
                to_date: req.query.to_date as string | undefined,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
            };
            const data = await MedicationTreatmentService.getMedicationRecords(patientId, filters);
            res.status(200).json({ success: true, message: MT_SUCCESS.MEDICATIONS_FETCHED, ...data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 2: Chi tiết đơn thuốc */
    static async getMedicationDetail(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const prescriptionId = req.params.prescriptionId as string;
            const data = await MedicationTreatmentService.getMedicationDetail(patientId, prescriptionId);
            res.status(200).json({ success: true, message: MT_SUCCESS.MEDICATION_DETAIL_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('không thuộc') ? 403 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 3: Thuốc đang sử dụng */
    static async getCurrentMedications(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const data = await MedicationTreatmentService.getCurrentMedications(patientId);
            res.status(200).json({ success: true, message: MT_SUCCESS.CURRENT_MEDS_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 4: Lịch sử điều trị */
    static async getTreatmentRecords(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const filters = {
                status: req.query.status as string | undefined,
                from_date: req.query.from_date as string | undefined,
                to_date: req.query.to_date as string | undefined,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 20,
            };
            const data = await MedicationTreatmentService.getTreatmentRecords(patientId, filters);
            res.status(200).json({ success: true, message: MT_SUCCESS.TREATMENTS_FETCHED, ...data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 5: Chi tiết kế hoạch điều trị */
    static async getTreatmentDetail(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const planId = req.params.planId as string;
            const data = await MedicationTreatmentService.getTreatmentDetail(patientId, planId);
            res.status(200).json({ success: true, message: MT_SUCCESS.TREATMENT_DETAIL_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('không thuộc') ? 403 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 6: Cảnh báo tương tác */
    static async checkInteractions(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const data = await MedicationTreatmentService.checkInteractions(patientId);
            res.status(200).json({ success: true, message: MT_SUCCESS.INTERACTIONS_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 7: Ghi nhận tuân thủ */
    static async createAdherence(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const userId = (req as any).auth?.user_id;
            const data = await MedicationTreatmentService.createAdherence(patientId, userId, req.body);
            res.status(201).json({ success: true, message: MT_SUCCESS.ADHERENCE_CREATED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404
                : error.message?.includes('bắt buộc') ? 400 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 8: Lịch sử tuân thủ */
    static async getAdherenceRecords(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const fromDate = req.query.from_date as string | undefined;
            const toDate = req.query.to_date as string | undefined;
            const data = await MedicationTreatmentService.getAdherenceRecords(patientId, fromDate, toDate);
            res.status(200).json({ success: true, message: MT_SUCCESS.ADHERENCE_FETCHED, ...data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    /** API 9: Timeline */
    static async getTimeline(req: Request, res: Response): Promise<void> {
        try {
            const patientId = req.params.patientId as string;
            const data = await MedicationTreatmentService.getTimeline(patientId);
            res.status(200).json({ success: true, message: MT_SUCCESS.TIMELINE_FETCHED, data });
        } catch (error: any) {
            const status = error.message?.includes('không tồn tại') ? 404 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }
}
