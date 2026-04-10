import { Request, Response } from 'express';
import { DiagnosisService } from '../../services/EMR/diagnosis.service';
import { AppError } from '../../utils/app-error.util';
import { HTTP_STATUS } from '../../constants/httpStatus.constant';
import { DIAGNOSIS_SUCCESS, DIAGNOSIS_CONFIG } from '../../constants/diagnosis.constant';


export class DiagnosisController {

    /** POST /api/diagnoses/:encounterId */
    static async create(req: Request, res: Response) {
        try {
            const encounterId = req.params.encounterId as string;
            const userId = (req as any).auth?.user_id;
            const record = await DiagnosisService.create(encounterId, req.body, userId);
            res.status(HTTP_STATUS.CREATED).json({ success: true, message: DIAGNOSIS_SUCCESS.CREATED, data: record });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[DiagnosisController.create] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi thêm chẩn đoán' });
            }
        }
    }

    /** GET /api/diagnoses/:encounterId */
    static async getByEncounterId(req: Request, res: Response) {
        try {
            const data = await DiagnosisService.getByEncounterId(req.params.encounterId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: DIAGNOSIS_SUCCESS.LIST_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[DiagnosisController.getByEncounterId] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** PATCH /api/diagnoses/:diagnosisId */
    static async update(req: Request, res: Response) {
        try {
            const record = await DiagnosisService.update(req.params.diagnosisId as string, req.body);
            res.status(HTTP_STATUS.OK).json({ success: true, message: DIAGNOSIS_SUCCESS.UPDATED, data: record });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[DiagnosisController.update] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi cập nhật chẩn đoán' });
            }
        }
    }

    /** DELETE /api/diagnoses/:diagnosisId */
    static async delete(req: Request, res: Response) {
        try {
            await DiagnosisService.delete(req.params.diagnosisId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: DIAGNOSIS_SUCCESS.DELETED });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[DiagnosisController.delete] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ khi xóa chẩn đoán' });
            }
        }
    }

    /** PATCH /api/diagnoses/:diagnosisId/type */
    static async changeType(req: Request, res: Response) {
        try {
            const record = await DiagnosisService.changeType(req.params.diagnosisId as string, req.body.new_type);
            res.status(HTTP_STATUS.OK).json({ success: true, message: DIAGNOSIS_SUCCESS.TYPE_CHANGED, data: record });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[DiagnosisController.changeType] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** PUT /api/diagnoses/:encounterId/conclusion */
    static async setConclusion(req: Request, res: Response) {
        try {
            const data = await DiagnosisService.setConclusion(req.params.encounterId as string, req.body.conclusion);
            res.status(HTTP_STATUS.OK).json({ success: true, message: DIAGNOSIS_SUCCESS.CONCLUSION_SAVED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[DiagnosisController.setConclusion] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** GET /api/diagnoses/:encounterId/conclusion */
    static async getConclusion(req: Request, res: Response) {
        try {
            const data = await DiagnosisService.getConclusion(req.params.encounterId as string);
            res.status(HTTP_STATUS.OK).json({ success: true, message: DIAGNOSIS_SUCCESS.CONCLUSION_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[DiagnosisController.getConclusion] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** GET /api/diagnoses/by-patient/:patientId */
    static async getByPatient(req: Request, res: Response) {
        try {
            const patientId = req.params.patientId as string;
            const page = req.query.page ? parseInt(req.query.page.toString()) : DIAGNOSIS_CONFIG.DEFAULT_PAGE;
            const limit = req.query.limit ? parseInt(req.query.limit.toString()) : DIAGNOSIS_CONFIG.DEFAULT_LIMIT;
            const icd10Code = req.query.icd10_code?.toString();
            const fromDate = req.query.from_date?.toString();
            const toDate = req.query.to_date?.toString();

            const result = await DiagnosisService.getByPatientId(patientId, page, limit, icd10Code, fromDate, toDate);
            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: DIAGNOSIS_SUCCESS.HISTORY_FETCHED,
                data: result.data,
                pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
            });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[DiagnosisController.getByPatient] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }

    /** GET /api/diagnoses/search-icd */
    static async searchICD(req: Request, res: Response) {
        try {
            const data = await DiagnosisService.searchICD(req.query.q?.toString() || '');
            res.status(HTTP_STATUS.OK).json({ success: true, message: DIAGNOSIS_SUCCESS.ICD_SEARCH_FETCHED, data });
        } catch (error: any) {
            if (error instanceof AppError) {
                res.status(error.httpCode).json({ success: false, code: error.code, message: error.message });
            } else {
                console.error('[DiagnosisController.searchICD] Error:', error);
                res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Lỗi máy chủ' });
            }
        }
    }
}
