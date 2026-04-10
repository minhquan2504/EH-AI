import { Request, Response } from 'express';
import { MedicalRecordService } from '../../services/EMR/medical-record.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { MEDICAL_RECORD_SUCCESS } from '../../constants/medical-record.constant';


export class MedicalRecordController {

    /** API 1: GET /api/medical-records/:encounterId — Bệnh án đầy đủ */
    static async getFullRecord(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const data = await MedicalRecordService.getFullRecord(encounterId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.RECORD_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[MedicalRecordController.getFullRecord] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 2: GET /api/medical-records/:encounterId/completeness — Tính đầy đủ */
    static async getCompleteness(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const data = await MedicalRecordService.getCompleteness(encounterId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.COMPLETENESS_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[MedicalRecordController.getCompleteness] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 3: POST /api/medical-records/:encounterId/finalize — Hoàn tất & khóa */
    static async finalize(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const data = await MedicalRecordService.finalize(encounterId, userId, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.FINALIZED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[MedicalRecordController.finalize] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 4: POST /api/medical-records/:encounterId/sign — Ký số */
    static async sign(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const clientIp = req.ip || req.socket.remoteAddress || null;
            const data = await MedicalRecordService.sign(encounterId, userId, req.body, clientIp);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.SIGNED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[MedicalRecordController.sign] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 5: GET /api/medical-records/by-patient/:patientId — DS bệnh án theo BN */
    static async getPatientRecords(req: Request, res: Response) {
        try {
            const patientId = req.params.patientId as string;
            const { page, limit, record_type, is_finalized, from_date, to_date } = req.query;
            const data = await MedicalRecordService.getPatientRecords(
                patientId,
                Number(page) || 1,
                Number(limit) || 20,
                record_type as string,
                is_finalized !== undefined ? is_finalized === 'true' : undefined,
                from_date as string,
                to_date as string
            );
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.PATIENT_RECORDS_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[MedicalRecordController.getPatientRecords] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 6: GET /api/medical-records/by-patient/:patientId/timeline — Dòng thời gian */
    static async getTimeline(req: Request, res: Response) {
        try {
            const patientId = req.params.patientId as string;
            const { from, to, event_type, limit } = req.query;
            const data = await MedicalRecordService.getTimeline(
                patientId, from as string, to as string,
                event_type as string, Number(limit) || undefined
            );
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.TIMELINE_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[MedicalRecordController.getTimeline] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 7: GET /api/medical-records/by-patient/:patientId/statistics — Thống kê */
    static async getStatistics(req: Request, res: Response) {
        try {
            const patientId = req.params.patientId as string;
            const data = await MedicalRecordService.getStatistics(patientId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.STATISTICS_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[MedicalRecordController.getStatistics] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 8: GET /api/medical-records/snapshot/:encounterId — Xem snapshot */
    static async getSnapshot(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const data = await MedicalRecordService.getSnapshot(encounterId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.SNAPSHOT_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[MedicalRecordController.getSnapshot] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 9: GET /api/medical-records/export/:encounterId — Xuất bệnh án */
    static async exportRecord(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const data = await MedicalRecordService.exportRecord(encounterId);
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.EXPORT_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[MedicalRecordController.exportRecord] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }

    /** API 10: GET /api/medical-records/search — Tìm kiếm nâng cao */
    static async searchRecords(req: Request, res: Response) {
        try {
            const { keyword, icd10_code, doctor_id, record_type, is_finalized, from_date, to_date, page, limit } = req.query;
            const data = await MedicalRecordService.searchRecords(
                keyword as string, icd10_code as string, doctor_id as string,
                record_type as string,
                is_finalized !== undefined ? is_finalized === 'true' : undefined,
                from_date as string, to_date as string,
                Number(page) || undefined, Number(limit) || undefined
            );
            res.status(HTTP_STATUS.OK).json({ success: true, message: MEDICAL_RECORD_SUCCESS.SEARCH_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            }
            console.error('[MedicalRecordController.searchRecords] Error:', error);
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi server' });
        }
    }
}
